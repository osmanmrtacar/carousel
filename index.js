import express from "express";
import cors from "cors";
import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import sharp from "sharp";
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync, unlinkSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";
import { tmpdir } from "os";
import { randomUUID } from "crypto";

// Helper to fetch images and convert to base64
async function fetchImageAsBase64(url) {
    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            },
        });
        if (!response.ok) {
            console.error(`Failed to fetch image: ${response.status} ${response.statusText}`);
            return null;
        }
        const arrayBuffer = await response.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString('base64');
        const contentType = response.headers.get('content-type') || 'image/jpeg';
        return `data:${contentType};base64,${base64}`;
    } catch (error) {
        console.error('Error fetching image:', error);
        return null;
    }
}

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(cors());
app.use(express.json());

// Load fonts
let fontData;
let bebasNeueFont;
try {
    fontData = readFileSync(join(__dirname, "fonts", "Roboto-Bold.ttf"));
} catch (e) {
    console.warn(
        "Font file not found. Please add Roboto-Bold.ttf to server/fonts/",
    );
}
try {
    bebasNeueFont = readFileSync(join(__dirname, "fonts", "BebasNeue-Regular.ttf"));
} catch (e) {
    console.warn(
        "Bebas Neue font not found. Please add BebasNeue-Regular.ttf to server/fonts/",
    );
}

// Star SVG component for Satori
function StarIcon(filled) {
    return {
        type: "svg",
        props: {
            width: 32,
            height: 32,
            viewBox: "0 0 24 24",
            fill: filled ? "#facc15" : "none",
            stroke: filled ? "#facc15" : "#6b7280",
            strokeWidth: 2,
            children: {
                type: "path",
                props: {
                    d: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
                },
            },
        },
    };
}

// Movie Card JSX Component for Satori
function MovieCardTemplate({ mainTitle, title, image, rating, year, genre, description }) {
    const stars = Array(5).fill(0).map((_, i) => i < rating);

    return {
        type: "div",
        props: {
            style: {
                display: "flex",
                flexDirection: "column",
                width: "100%",
                height: "100%",
                backgroundColor: "#000",
                position: "relative",
            },
            children: [
                // Background Image with gradient overlay
                {
                    type: "div",
                    props: {
                        style: {
                            display: "flex",
                            position: "absolute",
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                        },
                        children: [
                            {
                                type: "img",
                                props: {
                                    src: image,
                                    style: {
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "cover",
                                    },
                                },
                            },
                        ],
                    },
                },
                // Gradient overlay
                {
                    type: "div",
                    props: {
                        style: {
                            display: "flex",
                            position: "absolute",
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background:
                                "linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, transparent 40%, rgba(0,0,0,0.9) 100%)",
                        },
                    },
                },
                // Content
                {
                    type: "div",
                    props: {
                        style: {
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "space-between",
                            height: "100%",
                            padding: "40px",
                            position: "relative",
                        },
                        children: [
                            // Header
                            {
                                type: "div",
                                props: {
                                    style: {
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "flex-start",
                                    },
                                    children: [
                                        {
                                            type: "div",
                                            props: {
                                                style: {
                                                    display: "flex",
                                                    flexDirection: "column",
                                                    color: "white",
                                                },
                                                children: [
                                                    {
                                                        type: "div",
                                                        props: {
                                                            style: {
                                                                fontSize:
                                                                    "24px",
                                                                opacity: 0.8,
                                                            },
                                                            children:
                                                                "NOW PLAYING",
                                                        },
                                                    },
                                                    {
                                                        type: "div",
                                                        props: {
                                                            style: {
                                                                fontSize:
                                                                    "36px",
                                                                marginTop:
                                                                    "8px",
                                                            },
                                                            children: mainTitle,
                                                        },
                                                    },
                                                ],
                                            },
                                        },
                                        // Stars
                                        // {
                                        //     type: "div",
                                        //     props: {
                                        //         style: {
                                        //             display: "flex",
                                        //             gap: "8px",
                                        //         },
                                        //         children: stars.map((
                                        //             filled,
                                        //             i,
                                        //         ) => StarIcon(filled)),
                                        //     },
                                        // },
                                    ],
                                },
                            },
                            // watta.watch watermark - bottom right corner
                            {
                                type: "div",
                                props: {
                                    style: {
                                        display: "flex",
                                        position: "absolute",
                                        bottom: "40px",
                                        right: "40px",
                                        backgroundColor: "rgba(0,0,0,0.45)",
                                        borderRadius: "9999px",
                                        padding: "8px 20px",
                                    },
                                    children: {
                                        type: "span",
                                        props: {
                                            style: {
                                                fontSize: "22px",
                                                fontFamily: "Bebas Neue",
                                                fontWeight: 400,
                                                color: "rgba(255,255,255,0.7)",
                                                letterSpacing: "1px",
                                            },
                                            children: "watta.watch",
                                        },
                                    },
                                },
                            },
                            // Bottom Content
                            {
                                type: "div",
                                props: {
                                    style: {
                                        display: "flex",
                                        flexDirection: "column",
                                        color: "white",
                                        gap: "16px",
                                    },
                                    children: [
                                        // Genre & Year Badge
                                        {
                                            type: "div",
                                            props: {
                                                style: {
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "12px",
                                                    backgroundColor:
                                                        "rgba(255,255,255,0.1)",
                                                    padding: "12px 24px",
                                                    borderRadius: "9999px",
                                                    border:
                                                        "1px solid rgba(255,255,255,0.2)",
                                                    alignSelf: "flex-start",
                                                },
                                                children: [
                                                    {
                                                        type: "span",
                                                        props: {
                                                            style: {
                                                                fontSize:
                                                                    "22px",
                                                            },
                                                            children: genre,
                                                        },
                                                    },
                                                    {
                                                        type: "span",
                                                        props: {
                                                            style: {
                                                                fontSize:
                                                                    "22px",
                                                                opacity: 0.5,
                                                            },
                                                            children: "-",
                                                        },
                                                    },
                                                    {
                                                        type: "span",
                                                        props: {
                                                            style: {
                                                                fontSize:
                                                                    "22px",
                                                            },
                                                            children: String(
                                                                year ?? "",
                                                            ),
                                                        },
                                                    },
                                                ],
                                            },
                                        },
                                        // Title
                                        {
                                            type: "h1",
                                            props: {
                                                style: {
                                                    fontSize: "72px",
                                                    margin: 0,
                                                    textShadow:
                                                        "0 4px 8px rgba(0,0,0,0.5)",
                                                },
                                                children: title,
                                            },
                                        },
                                        // Description
                                        {
                                            type: "p",
                                            props: {
                                                style: {
                                                    fontSize: "28px",
                                                    opacity: 0.9,
                                                    maxWidth: "900px",
                                                    lineHeight: 1.5,
                                                    margin: 0,
                                                },
                                                children: description,
                                            },
                                        },
                                        // Rating Display
                                        {
                                            type: "div",
                                            props: {
                                                style: {
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "16px",
                                                },
                                                children: [
                                                    {
                                                        type: "div",
                                                        props: {
                                                            style: {
                                                                display: "flex",
                                                                alignItems:
                                                                    "center",
                                                                gap: "8px",
                                                                backgroundColor:
                                                                    "rgba(250,204,21,0.2)",
                                                                padding:
                                                                    "8px 16px",
                                                                borderRadius:
                                                                    "9999px",
                                                                border:
                                                                    "1px solid rgba(250,204,21,0.3)",
                                                            },
                                                            children: [
                                                                StarIcon(true),
                                                                {
                                                                    type:
                                                                        "span",
                                                                    props: {
                                                                        style: {
                                                                            color:
                                                                                "#facc15",
                                                                            fontSize:
                                                                                "24px",
                                                                        },
                                                                        children:
                                                                            `${rating}/10`,
                                                                    },
                                                                },
                                                            ],
                                                        },
                                                    },
                                                    {
                                                        type: "span",
                                                        props: {
                                                            style: {
                                                                fontSize:
                                                                    "22px",
                                                                opacity: 0.6,
                                                            },
                                                            children:
                                                                "Audience Score",
                                                        },
                                                    },
                                                ],
                                            },
                                        },
                                    ],
                                },
                            },
                        ],
                    },
                },
            ],
        },
    };
}

// Generate a random vibrant accent color
function getRandomAccentColor() {
    const colors = [
        "#DB3E1B", // Orange-red
        "#E91E63", // Pink
        "#9C27B0", // Purple
        "#673AB7", // Deep Purple
        "#3F51B5", // Indigo
        "#2196F3", // Blue
        "#00BCD4", // Cyan
        "#009688", // Teal
        "#4CAF50", // Green
        "#8BC34A", // Light Green
        "#FF9800", // Orange
        "#FF5722", // Deep Orange
        "#F44336", // Red
        "#00E676", // Bright Green
        "#FFD600", // Yellow
    ];
    return colors[Math.floor(Math.random() * colors.length)];
}

// Cover Slide Template - TikTok carousel style with hook + branding
function CoverSlideTemplate({
    title = "Trending on Netflix",
    hookText = "Can't decide what to watch?",
    backgroundColor = "#eab308"
}) {
    return {
        type: "div",
        props: {
            style: {
                width: "100%",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                padding: "70px",
                backgroundColor: backgroundColor,
            },
            children: [
                // Top: watta.watch branding
                {
                    type: "div",
                    props: {
                        style: {
                            display: "flex",
                            alignItems: "center",
                            gap: "14px",
                        },
                        children: [
                            {
                                type: "div",
                                props: {
                                    style: {
                                        display: "flex",
                                        backgroundColor: "rgba(0,0,0,0.2)",
                                        borderRadius: "9999px",
                                        padding: "12px 28px",
                                    },
                                    children: {
                                        type: "span",
                                        props: {
                                            style: {
                                                fontSize: "30px",
                                                fontFamily: "Bebas Neue",
                                                fontWeight: 400,
                                                color: "white",
                                                letterSpacing: "2px",
                                            },
                                            children: "watta.watch",
                                        },
                                    },
                                },
                            },
                        ],
                    },
                },
                // Middle: hook + main title stacked
                {
                    type: "div",
                    props: {
                        style: {
                            display: "flex",
                            flexDirection: "column",
                            gap: "20px",
                        },
                        children: [
                            // Hook question - smaller, italic-feel
                            {
                                type: "div",
                                props: {
                                    style: {
                                        display: "flex",
                                        fontSize: "52px",
                                        fontFamily: "Inter",
                                        fontWeight: 700,
                                        color: "rgba(255,255,255,0.85)",
                                        lineHeight: 1.2,
                                    },
                                    children: hookText,
                                },
                            },
                            // Main platform title - huge
                            {
                                type: "div",
                                props: {
                                    style: {
                                        display: "flex",
                                        fontSize: "148px",
                                        fontFamily: "Bebas Neue",
                                        fontWeight: 400,
                                        lineHeight: 0.9,
                                        textTransform: "uppercase",
                                        color: "white",
                                        letterSpacing: "2px",
                                    },
                                    children: title,
                                },
                            },
                        ],
                    },
                },
                // Bottom: swipe hint
                {
                    type: "div",
                    props: {
                        style: {
                            display: "flex",
                            justifyContent: "flex-end",
                            alignItems: "center",
                            gap: "10px",
                        },
                        children: {
                            type: "div",
                            props: {
                                style: {
                                    display: "flex",
                                    fontSize: "32px",
                                    fontFamily: "Bebas Neue",
                                    fontWeight: 400,
                                    color: "rgba(255,255,255,0.7)",
                                    letterSpacing: "3px",
                                },
                                children: "SWIPE FOR THE LIST >>",
                            },
                        },
                    },
                },
            ],
        },
    };
}

// CTA Slide Template for TikTok carousels - last slide driving app downloads
function CarouselCTASlideTemplate({ backgroundColor = "#eab308" }) {
    return {
        type: "div",
        props: {
            style: {
                width: "100%",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                padding: "80px",
                backgroundColor: backgroundColor,
                gap: "40px",
            },
            children: [
                // Main CTA
                {
                    type: "div",
                    props: {
                        style: {
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: "24px",
                        },
                        children: [
                            {
                                type: "div",
                                props: {
                                    style: {
                                        display: "flex",
                                        fontSize: "42px",
                                        fontFamily: "Inter",
                                        fontWeight: 700,
                                        color: "rgba(255,255,255,0.85)",
                                        textAlign: "center",
                                        lineHeight: 1.3,
                                    },
                                    children: "Let AI pick what you watch next",
                                },
                            },
                            {
                                type: "div",
                                props: {
                                    style: {
                                        display: "flex",
                                        fontSize: "140px",
                                        fontFamily: "Bebas Neue",
                                        fontWeight: 400,
                                        lineHeight: 0.9,
                                        textTransform: "uppercase",
                                        color: "white",
                                        letterSpacing: "2px",
                                        textAlign: "center",
                                    },
                                    children: "watta.watch",
                                },
                            },
                            {
                                type: "div",
                                props: {
                                    style: {
                                        display: "flex",
                                        backgroundColor: "rgba(0,0,0,0.25)",
                                        borderRadius: "9999px",
                                        padding: "18px 48px",
                                        marginTop: "10px",
                                    },
                                    children: {
                                        type: "span",
                                        props: {
                                            style: {
                                                fontSize: "34px",
                                                fontFamily: "Bebas Neue",
                                                fontWeight: 400,
                                                color: "white",
                                                letterSpacing: "3px",
                                            },
                                            children: "FREE ON IOS  •  LINK IN BIO",
                                        },
                                    },
                                },
                            },
                        ],
                    },
                },
            ],
        },
    };
}

// Hook Slide Template for Reels - Poster collage background with large centered text
function HookSlideTemplate({ hookText = "STOP scrolling Netflix", posters = [] }) {
    // Create poster grid positions for collage effect
    const posterPositions = [
        { top: 0, left: 0, width: "540px", height: "810px" },
        { top: 0, left: 540, width: "540px", height: "810px" },
        { top: 810, left: 0, width: "540px", height: "810px" },
        { top: 810, left: 540, width: "540px", height: "810px" },
        { top: 1620, left: 0, width: "540px", height: "300px" },
        { top: 1620, left: 540, width: "540px", height: "300px" },
    ];

    return {
        type: "div",
        props: {
            style: {
                width: "100%",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                position: "relative",
                backgroundColor: "#0a0a0a",
            },
            children: [
                // Poster collage background
                ...posters.slice(0, 6).map((poster, index) => ({
                    type: "img",
                    props: {
                        src: poster,
                        style: {
                            position: "absolute",
                            top: `${posterPositions[index]?.top || 0}px`,
                            left: `${posterPositions[index]?.left || 0}px`,
                            width: posterPositions[index]?.width || "540px",
                            height: posterPositions[index]?.height || "810px",
                            objectFit: "cover",
                            opacity: 0.4,
                        },
                    },
                })),
                // Dark overlay for better text readability
                {
                    type: "div",
                    props: {
                        style: {
                            position: "absolute",
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: "rgba(0, 0, 0, 0.6)",
                        },
                    },
                },
                // Hook text block
                {
                    type: "div",
                    props: {
                        style: {
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: "32px",
                            position: "relative",
                            padding: "80px",
                        },
                        children: [
                            {
                                type: "div",
                                props: {
                                    style: {
                                        display: "flex",
                                        fontSize: "120px",
                                        fontFamily: "Bebas Neue",
                                        fontWeight: 400,
                                        lineHeight: 1.05,
                                        textTransform: "uppercase",
                                        color: "white",
                                        letterSpacing: "4px",
                                        textAlign: "center",
                                        maxWidth: "900px",
                                    },
                                    children: hookText,
                                },
                            },
                            // watta.watch sub-label
                            {
                                type: "div",
                                props: {
                                    style: {
                                        display: "flex",
                                        backgroundColor: "rgba(234,179,8,0.85)",
                                        borderRadius: "9999px",
                                        padding: "14px 36px",
                                    },
                                    children: {
                                        type: "span",
                                        props: {
                                            style: {
                                                fontSize: "32px",
                                                fontFamily: "Bebas Neue",
                                                fontWeight: 400,
                                                color: "white",
                                                letterSpacing: "3px",
                                            },
                                            children: "watta.watch  •  AI PICKS",
                                        },
                                    },
                                },
                            },
                        ],
                    },
                },
            ],
        },
    };
}

// Reel Movie Slide Template - Centered poster card with title, place, and rating
function ReelMovieSlideTemplate({ title, poster, rating, year, genre, place }) {
    // SVG Star icon for rating
    const StarSvg = {
        type: "svg",
        props: {
            width: 40,
            height: 40,
            viewBox: "0 0 24 24",
            fill: "#facc15",
            children: {
                type: "path",
                props: {
                    d: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
                },
            },
        },
    };

    return {
        type: "div",
        props: {
            style: {
                width: "100%",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                padding: "60px",
                backgroundColor: "#0a0a0a",
            },
            children: [
                // Movie poster card
                {
                    type: "div",
                    props: {
                        style: {
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: "30px",
                        },
                        children: [
                            // Place number badge
                            place ? {
                                type: "div",
                                props: {
                                    style: {
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontSize: "72px",
                                        fontFamily: "Bebas Neue",
                                        fontWeight: 400,
                                        color: "white",
                                        letterSpacing: "2px",
                                    },
                                    children: `#${place}`,
                                },
                            } : null,
                            // Poster image container
                            {
                                type: "div",
                                props: {
                                    style: {
                                        display: "flex",
                                        borderRadius: "20px",
                                        overflow: "hidden",
                                        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.8)",
                                    },
                                    children: [
                                        {
                                            type: "img",
                                            props: {
                                                src: poster,
                                                style: {
                                                    width: "600px",
                                                    height: "900px",
                                                    objectFit: "cover",
                                                },
                                            },
                                        },
                                    ],
                                },
                            },
                            // Movie title
                            {
                                type: "div",
                                props: {
                                    style: {
                                        display: "flex",
                                        fontSize: "64px",
                                        fontFamily: "Bebas Neue",
                                        fontWeight: 400,
                                        color: "white",
                                        letterSpacing: "2px",
                                        textAlign: "center",
                                        maxWidth: "900px",
                                    },
                                    children: title,
                                },
                            },
                            // Rating badge with SVG star
                            {
                                type: "div",
                                props: {
                                    style: {
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "12px",
                                        backgroundColor: "rgba(250, 204, 21, 0.15)",
                                        padding: "16px 32px",
                                        borderRadius: "9999px",
                                        border: "2px solid rgba(250, 204, 21, 0.3)",
                                    },
                                    children: [
                                        StarSvg,
                                        {
                                            type: "span",
                                            props: {
                                                style: {
                                                    fontSize: "48px",
                                                    fontFamily: "Bebas Neue",
                                                    color: "#facc15",
                                                    letterSpacing: "1px",
                                                },
                                                children: String(rating),
                                            },
                                        },
                                    ],
                                },
                            },
                            // Year and genre
                            year || genre ? {
                                type: "div",
                                props: {
                                    style: {
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "16px",
                                        marginTop: "10px",
                                    },
                                    children: [
                                        year ? {
                                            type: "span",
                                            props: {
                                                style: {
                                                    fontSize: "32px",
                                                    fontFamily: "Inter",
                                                    color: "rgba(255, 255, 255, 0.6)",
                                                },
                                                children: String(year),
                                            },
                                        } : null,
                                        year && genre ? {
                                            type: "span",
                                            props: {
                                                style: {
                                                    fontSize: "32px",
                                                    color: "rgba(255, 255, 255, 0.3)",
                                                },
                                                children: "\u2022",
                                            },
                                        } : null,
                                        genre ? {
                                            type: "span",
                                            props: {
                                                style: {
                                                    fontSize: "32px",
                                                    fontFamily: "Inter",
                                                    color: "rgba(255, 255, 255, 0.6)",
                                                },
                                                children: genre,
                                            },
                                        } : null,
                                    ].filter(Boolean),
                                },
                            } : null,
                        ].filter(Boolean),
                    },
                },
            ],
        },
    };
}

// CTA Slide Template for Instagram Reels - App download focused
function CTASlideTemplate({ ctaText = "Download Watta Watch" }) {
    return {
        type: "div",
        props: {
            style: {
                width: "100%",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                padding: "80px",
                background: "linear-gradient(160deg, #1a1a2e 0%, #16213e 60%, #0f0f23 100%)",
                gap: "0px",
            },
            children: [
                // "Stop scrolling. Start watching." top label
                {
                    type: "div",
                    props: {
                        style: {
                            display: "flex",
                            fontSize: "38px",
                            fontFamily: "Inter",
                            fontWeight: 700,
                            color: "rgba(255,255,255,0.5)",
                            letterSpacing: "2px",
                            textAlign: "center",
                            textTransform: "uppercase",
                            marginBottom: "30px",
                        },
                        children: "Stop scrolling. Start watching.",
                    },
                },
                // Big app name
                {
                    type: "div",
                    props: {
                        style: {
                            display: "flex",
                            fontSize: "130px",
                            fontFamily: "Bebas Neue",
                            fontWeight: 400,
                            lineHeight: 0.9,
                            color: "#eab308",
                            letterSpacing: "4px",
                            textAlign: "center",
                        },
                        children: "WATTA\nWATCH",
                    },
                },
                // Tagline
                {
                    type: "div",
                    props: {
                        style: {
                            display: "flex",
                            fontSize: "36px",
                            fontFamily: "Inter",
                            fontWeight: 700,
                            color: "rgba(255,255,255,0.65)",
                            textAlign: "center",
                            marginTop: "28px",
                            maxWidth: "800px",
                            lineHeight: 1.4,
                        },
                        children: "AI-powered movie & TV guide.\nNo more endless scrolling.",
                    },
                },
                // CTA pill button
                {
                    type: "div",
                    props: {
                        style: {
                            display: "flex",
                            backgroundColor: "#eab308",
                            borderRadius: "9999px",
                            padding: "28px 64px",
                            marginTop: "60px",
                        },
                        children: {
                            type: "span",
                            props: {
                                style: {
                                    fontSize: "44px",
                                    fontFamily: "Bebas Neue",
                                    fontWeight: 400,
                                    color: "white",
                                    letterSpacing: "3px",
                                },
                                children: ctaText,
                            },
                        },
                    },
                },
                // Link in bio note
                {
                    type: "div",
                    props: {
                        style: {
                            display: "flex",
                            fontSize: "30px",
                            fontFamily: "Inter",
                            fontWeight: 700,
                            color: "rgba(255,255,255,0.35)",
                            marginTop: "28px",
                            letterSpacing: "1px",
                            textTransform: "uppercase",
                        },
                        children: "↑  Link in bio  •  Free on iOS",
                    },
                },
            ],
        },
    };
}

// API endpoint to generate cover slide
app.post("/api/generate-cover", async (req, res) => {
    try {
        const {
            title = "Trending on Netflix",
            hookText = "Can't decide what to watch?",
            backgroundColor = "#eab308",
            width = 1080,
            height = 1350,
        } = req.body;

        if (!bebasNeueFont) {
            return res.status(500).json({
                error:
                    "Font not configured. Add BebasNeue-Regular.ttf to server/fonts/",
            });
        }

        // Generate SVG using Satori
        const svg = await satori(
            CoverSlideTemplate({
                title,
                hookText,
                backgroundColor,
            }),
            {
                width,
                height,
                fonts: [
                    {
                        name: "Bebas Neue",
                        data: bebasNeueFont,
                        weight: 400,
                        style: "normal",
                    },
                    {
                        name: "Inter",
                        data: fontData,
                        weight: 700,
                        style: "normal",
                    },
                ],
            },
        );

        // Convert SVG to PNG using Resvg
        const resvg = new Resvg(svg, {
            background: "rgba(0, 0, 0, 1)",
            fitTo: {
                mode: "width",
                value: width,
            },
        });

        const pngData = resvg.render();
        const pngBuffer = pngData.asPng();

        // Return the PNG image
        res.setHeader("Content-Type", "image/png");
        res.setHeader(
            "Content-Disposition",
            `attachment; filename="cover-slide.png"`,
        );
        res.send(pngBuffer);
    } catch (error) {
        console.error("Error generating cover slide:", error);
        res.status(500).json({
            error: "Failed to generate cover slide",
            details: error.message,
        });
    }
});

// API endpoint to generate movie card
app.post("/api/generate-card", async (req, res) => {
    try {
        const {
            mainTitle = "Popular Movies 2026",
            title = "Movie Title",
            image =
            "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=1080",
            rating = 4,
            year = 2026,
            genre = "Action",
            description = "An amazing movie experience.",
            width = 1080,
            height = 1350,
        } = req.body;

        if (!fontData) {
            return res.status(500).json({
                error:
                    "Font not configured. Add Inter-Bold.ttf to server/fonts/",
            });
        }

        // Fetch and convert image to base64 for Satori
        const imageBase64 = await fetchImageAsBase64(image);
        if (!imageBase64) {
            return res.status(400).json({
                error: "Failed to fetch image from URL",
            });
        }

        // Generate SVG using Satori
        const svg = await satori(
            MovieCardTemplate({
                mainTitle,
                title,
                image: imageBase64,
                rating,
                year,
                genre,
                description,
            }),
            {
                width,
                height,
                fonts: [
                    {
                        name: "Inter",
                        data: fontData,
                        weight: 700,
                        style: "normal",
                    },
                ],
            },
        );

        // Convert SVG to PNG using Resvg
        const resvg = new Resvg(svg, {
            background: "rgba(0, 0, 0, 1)",
            fitTo: {
                mode: "width",
                value: width,
            },
        });

        const pngData = resvg.render();
        const pngBuffer = pngData.asPng();

        const jpegBuffer = await sharp(pngBuffer)
            .jpeg({ quality: 85, mozjpeg: true })
            .toBuffer();

        // Return the JPEG image
        res.setHeader("Content-Type", "image/jpeg");
        res.setHeader(
            "Content-Disposition",
            `attachment; filename="${title.toLowerCase().replace(/\s+/g, "-")
            }-movie-card.jpg"`,
        );
        res.send(jpegBuffer);
    } catch (error) {
        console.error("Error generating card:", error);
        res.status(500).json({
            error: "Failed to generate movie card",
            details: error.message,
        });
    }
});

// API endpoint to generate carousel CTA slide (last slide for TikTok carousels)
app.post("/api/generate-carousel-cta", async (req, res) => {
    try {
        const {
            backgroundColor = "#eab308",
            width = 1080,
            height = 1350,
        } = req.body;

        if (!bebasNeueFont || !fontData) {
            return res.status(500).json({
                error: "Fonts not configured.",
            });
        }

        const svg = await satori(
            CarouselCTASlideTemplate({ backgroundColor }),
            {
                width,
                height,
                fonts: [
                    {
                        name: "Bebas Neue",
                        data: bebasNeueFont,
                        weight: 400,
                        style: "normal",
                    },
                    {
                        name: "Inter",
                        data: fontData,
                        weight: 700,
                        style: "normal",
                    },
                ],
            },
        );

        const resvg = new Resvg(svg, {
            background: "rgba(0, 0, 0, 1)",
            fitTo: { mode: "width", value: width },
        });

        const pngBuffer = resvg.render().asPng();

        res.setHeader("Content-Type", "image/png");
        res.setHeader("Content-Disposition", `attachment; filename="carousel-cta.png"`);
        res.send(pngBuffer);
    } catch (error) {
        console.error("Error generating carousel CTA:", error);
        res.status(500).json({ error: "Failed to generate carousel CTA", details: error.message });
    }
});

// Health check endpoint
app.get("/api/health", (req, res) => {
    res.json({ status: "ok", fontLoaded: !!fontData });
});

// Example usage endpoint
app.get("/api/example", (req, res) => {
    res.json({
        endpoint: "POST /api/generate-card",
        body: {
            title: "Inception",
            image: "https://example.com/movie-poster.jpg",
            rating: 5,
            year: 2026,
            genre: "Sci-Fi",
            description: "A mind-bending thriller about dreams within dreams.",
            width: 1080,
            height: 1350,
        },
    });
});

// Helper function to generate a slide PNG
async function generateSlidePng(template, width, height) {
    const svg = await satori(template, {
        width,
        height,
        fonts: [
            {
                name: "Bebas Neue",
                data: bebasNeueFont,
                weight: 400,
                style: "normal",
            },
            {
                name: "Inter",
                data: fontData,
                weight: 700,
                style: "normal",
            },
        ],
    });

    const resvg = new Resvg(svg, {
        background: "rgba(0, 0, 0, 1)",
        fitTo: {
            mode: "width",
            value: width,
        },
    });

    const pngData = resvg.render();
    return pngData.asPng();
}

// API endpoint to generate Instagram Reels/TikTok video
app.post("/api/generate-reel", async (req, res) => {
    const sessionId = randomUUID();
    const tempDir = join(tmpdir(), `reel-${sessionId}`);

    try {
        const { hookText, movies, ctaText, audioUrl, platform = "instagram" } = req.body;

        // Validation
        if (!hookText) {
            return res.status(400).json({ error: "hookText is required" });
        }
        if (!movies || !Array.isArray(movies) || movies.length < 2 || movies.length > 6) {
            return res.status(400).json({ error: "movies must be an array with 2-6 items" });
        }
        if (!ctaText) {
            return res.status(400).json({ error: "ctaText is required" });
        }

        // Validate each movie has required fields
        for (let i = 0; i < movies.length; i++) {
            const movie = movies[i];
            if (!movie.title || !movie.poster || movie.rating === undefined) {
                return res.status(400).json({
                    error: `Movie at index ${i} must have title, poster, and rating`
                });
            }
        }

        if (!bebasNeueFont || !fontData) {
            return res.status(500).json({
                error: "Fonts not configured. Ensure BebasNeue-Regular.ttf and Roboto-Bold.ttf are in the fonts/ directory.",
            });
        }

        // Create temp directory
        mkdirSync(tempDir, { recursive: true });

        const width = 1080;
        const height = 1920;
        const slideFiles = [];
        const slideDurations = [];

        // Fetch all posters first (needed for hook slide background)
        console.log(`[${sessionId}] Fetching movie posters...`);
        const posterBase64Array = [];
        for (let i = 0; i < movies.length; i++) {
            const movie = movies[i];
            const posterBase64 = await fetchImageAsBase64(movie.poster);
            if (!posterBase64) {
                return res.status(400).json({
                    error: `Failed to fetch poster for movie: ${movie.title}`
                });
            }
            posterBase64Array.push(posterBase64);
        }

        // Instagram Reels: longer durations for higher completion rate
        // TikTok video: snappier pacing
        const isInstagram = platform !== "tiktok";
        const hookDuration = isInstagram ? 2.0 : 1.5;
        const movieDuration = isInstagram ? 1.5 : 1.0;
        const ctaDuration = isInstagram ? 2.0 : 1.2;

        // Generate Hook slide with poster collage background
        console.log(`[${sessionId}] Generating hook slide...`);
        const hookPng = await generateSlidePng(HookSlideTemplate({ hookText, posters: posterBase64Array }), width, height);
        const hookPath = join(tempDir, "slide_0_hook.png");
        writeFileSync(hookPath, hookPng);
        slideFiles.push(hookPath);
        slideDurations.push(hookDuration);

        // Generate Movie slides
        for (let i = 0; i < movies.length; i++) {
            const movie = movies[i];
            console.log(`[${sessionId}] Generating movie slide ${i + 1}: ${movie.title}...`);

            const moviePng = await generateSlidePng(
                ReelMovieSlideTemplate({
                    title: movie.title,
                    poster: posterBase64Array[i],
                    rating: movie.rating,
                    year: movie.year,
                    genre: movie.genre,
                    place: movies.length - i,
                }),
                width,
                height
            );
            const moviePath = join(tempDir, `slide_${i + 1}_movie.png`);
            writeFileSync(moviePath, moviePng);
            slideFiles.push(moviePath);
            slideDurations.push(movieDuration);
        }

        // Generate CTA slide
        console.log(`[${sessionId}] Generating CTA slide...`);
        const ctaPng = await generateSlidePng(CTASlideTemplate({ ctaText }), width, height);
        const ctaPath = join(tempDir, `slide_${movies.length + 1}_cta.png`);
        writeFileSync(ctaPath, ctaPng);
        slideFiles.push(ctaPath);
        slideDurations.push(ctaDuration);

        // Generate individual video segments with zoom effect
        console.log(`[${sessionId}] Creating video segments with zoom effect...`);
        const segmentFiles = [];

        for (let i = 0; i < slideFiles.length; i++) {
            const slideFile = slideFiles[i];
            const duration = slideDurations[i];
            const frameCount = Math.round(duration * 30);
            const segmentPath = join(tempDir, `segment_${i}.mp4`);

            // Calculate zoom increment to spread 3% zoom across entire duration
            const zoomIncrement = (0.03 / frameCount).toFixed(6);

            // Use zoompan filter for subtle zoom (1.00 -> 1.03)
            const ffmpegZoomCmd = `ffmpeg -y -loop 1 -i "${slideFile}" -vf "zoompan=z='min(zoom+${zoomIncrement},1.03)':d=${frameCount}:s=${width}x${height}:fps=30" -t ${duration} -c:v libx264 -pix_fmt yuv420p -preset fast "${segmentPath}"`;

            execSync(ffmpegZoomCmd, { stdio: "pipe" });
            segmentFiles.push(segmentPath);
        }

        // Create concat list file
        const concatListPath = join(tempDir, "concat_list.txt");
        const concatContent = segmentFiles.map(f => `file '${f}'`).join("\n");
        writeFileSync(concatListPath, concatContent);

        // Concatenate all segments
        console.log(`[${sessionId}] Concatenating video segments...`);
        const concatenatedPath = join(tempDir, "concatenated.mp4");
        const ffmpegConcatCmd = `ffmpeg -y -f concat -safe 0 -i "${concatListPath}" -c copy "${concatenatedPath}"`;
        execSync(ffmpegConcatCmd, { stdio: "pipe" });

        // Calculate total video duration
        const totalDuration = slideDurations.reduce((sum, d) => sum + d, 0);

        // Add audio track
        const finalPath = join(tempDir, "final.mp4");

        if (audioUrl) {
            let audioPath;

            // Check if it's a local file path or URL
            if (audioUrl.startsWith('/') || audioUrl.startsWith('./') || audioUrl.startsWith('../')) {
                // Local file path
                const absolutePath = audioUrl.startsWith('/') ? audioUrl : join(process.cwd(), audioUrl);
                if (!existsSync(absolutePath)) {
                    return res.status(400).json({ error: `Audio file not found: ${absolutePath}` });
                }
                audioPath = absolutePath;
                console.log(`[${sessionId}] Using local audio file: ${audioPath}`);
            } else {
                // Remote URL - download it
                console.log(`[${sessionId}] Downloading audio from ${audioUrl}...`);
                audioPath = join(tempDir, "audio.mp3");
                const audioResponse = await fetch(audioUrl);
                if (!audioResponse.ok) {
                    return res.status(400).json({ error: "Failed to fetch audio from audioUrl" });
                }
                const audioBuffer = Buffer.from(await audioResponse.arrayBuffer());
                writeFileSync(audioPath, audioBuffer);
            }

            // Add background music (trim audio to match video duration)
            console.log(`[${sessionId}] Adding background music...`);
            const ffmpegAudioCmd = `ffmpeg -y -i "${concatenatedPath}" -i "${audioPath}" -t ${totalDuration} -c:v copy -c:a aac -map 0:v:0 -map 1:a:0 "${finalPath}"`;
            execSync(ffmpegAudioCmd, { stdio: "pipe" });
        } else {
            // Add silent audio track for Instagram compatibility
            console.log(`[${sessionId}] Adding silent audio track...`);
            const ffmpegSilentCmd = `ffmpeg -y -i "${concatenatedPath}" -f lavfi -t ${totalDuration} -i anullsrc=r=44100:cl=stereo -c:v copy -c:a aac -map 0:v:0 -map 1:a:0 "${finalPath}"`;
            execSync(ffmpegSilentCmd, { stdio: "pipe" });
        }

        // Read final video
        console.log(`[${sessionId}] Reading final video...`);
        const videoBuffer = readFileSync(finalPath);

        // Cleanup temp directory
        console.log(`[${sessionId}] Cleaning up temp files...`);
        rmSync(tempDir, { recursive: true, force: true });

        // Send response
        res.setHeader("Content-Type", "video/mp4");
        res.setHeader("Content-Disposition", `attachment; filename="reel-${sessionId}.mp4"`);
        res.send(videoBuffer);

        console.log(`[${sessionId}] Reel generated successfully!`);
    } catch (error) {
        console.error(`[${sessionId}] Error generating reel:`, error);

        // Cleanup on error
        if (existsSync(tempDir)) {
            rmSync(tempDir, { recursive: true, force: true });
        }

        res.status(500).json({
            error: "Failed to generate reel",
            details: error.message,
        });
    }
});

// Example usage endpoint for reel generation
app.get("/api/reel-example", (req, res) => {
    res.json({
        endpoint: "POST /api/generate-reel",
        body: {
            hookText: "STOP scrolling Netflix",
            movies: [
                { title: "Inception", poster: "https://image.tmdb.org/t/p/w500/...", rating: 8.8, year: 2010, genre: "Sci-Fi" },
                { title: "Interstellar", poster: "https://image.tmdb.org/t/p/w500/...", rating: 8.6, year: 2014, genre: "Sci-Fi" },
            ],
            ctaText: "Follow @wattawatch",
            audioUrl: "https://example.com/music.mp3 (optional)",
        },
        notes: {
            resolution: "1080x1920 (9:16 vertical)",
            duration: "6-9 seconds depending on movie count",
            format: "H.264 MP4 with AAC audio",
        },
    });
});

const PORT = process.env.PORT || 45444;
app.listen(PORT, () => {
    console.log(`🎬 Movie Card API running at http://localhost:${PORT}`);
    console.log(`📖 Example: GET http://localhost:${PORT}/api/example`);
    console.log(`🏥 Health: GET http://localhost:${PORT}/api/health`);
});
