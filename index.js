import express from "express";
import cors from "cors";
import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

// Helper to fetch images and convert to base64
async function fetchImageAsBase64(url) {
    try {
        const response = await fetch(url);
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

// Load a font (you'll need to add a font file)
// Download Inter font from Google Fonts and place it in server/fonts/
let fontData;
try {
    fontData = readFileSync(join(__dirname, "fonts", "Roboto-Bold.ttf"));
} catch (e) {
    console.warn(
        "Font file not found. Please add Roboto-Bold.ttf to server/fonts/",
    );
    console.warn("Download from: https://fonts.google.com/specimen/Roboto");
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

        // Return the PNG image
        res.setHeader("Content-Type", "image/png");
        res.setHeader(
            "Content-Disposition",
            `attachment; filename="${
                title.toLowerCase().replace(/\s+/g, "-")
            }-movie-card.png"`,
        );
        res.send(pngBuffer);
    } catch (error) {
        console.error("Error generating card:", error);
        res.status(500).json({
            error: "Failed to generate movie card",
            details: error.message,
        });
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

const PORT = process.env.PORT || 45444;
app.listen(PORT, () => {
    console.log(`🎬 Movie Card API running at http://localhost:${PORT}`);
    console.log(`📖 Example: GET http://localhost:${PORT}/api/example`);
    console.log(`🏥 Health: GET http://localhost:${PORT}/api/health`);
});
