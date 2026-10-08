#!/usr/bin/env python3
"""
Generate photorealistic architectural scale-model renders for the Asset Vault
chambers, using Google Gemini image generation ("Nano Banana").

SETUP (one time):
    pip install google-genai pillow
    set GEMINI_API_KEY=your-key        # get a free key: https://aistudio.google.com/apikey
    (PowerShell:  $env:GEMINI_API_KEY="your-key")

RUN:
    python gen_assets.py               # uses the Pro model (best quality)
    python gen_assets.py --flash       # faster/cheaper model

Output → assets/asset-foundation.png, asset-multifamily.png, asset-undercontract.png
(The vault auto-loads whatever is at those paths.)
"""
import os, sys

STUDIO = (
    "Photorealistic macro photograph of a highly detailed physical ARCHITECTURAL SCALE MODEL "
    "(miniature diorama) sitting on a round dark polished pedestal in a black photography studio. "
    "Dramatic warm cinematic night lighting; hundreds of tiny glowing warm interior windows. "
    "Shallow depth of field / subtle tilt-shift, ultra-detailed, 8k, professional real-estate "
    "presentation model. Pure black seamless background. No text, no labels, no watermark, no people."
)

ASSETS = {
    "asset-foundation": STUDIO + " The model shows a DIVERSIFIED real-estate community: several modern "
        "mid- and high-rise multi-unit residential apartment towers grouped in the centre-back; a cluster of small "
        "single-family houses with pitched roofs on the left; low modern flat-roof commercial buildings with green "
        "landscaped open land on the right; curved streets, tiny trees, parked cars and street lamps throughout.",
    "asset-multifamily": STUDIO + " The model shows ONE focused multifamily community: two modern mid-rise "
        "residential apartment towers with balconies and warmly lit windows, a small amenity clubhouse, a landscaped "
        "courtyard with a pool, trees and a parking area.",
    "asset-undercontract": STUDIO + " The model shows a DENSE cluster of several tall modern high-rise apartment "
        "towers standing close together (glass and concrete facades, warmly lit windows), a landscaped plaza, roads, "
        "cars and trees at the base.",
}

def main():
    flash = "--flash" in sys.argv
    try:
        from google import genai
        from google.genai import types
    except ImportError:
        sys.exit("google-genai not installed.  Run:  pip install google-genai pillow")
    key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
    if not key:
        sys.exit("No GEMINI_API_KEY.  Get one free at https://aistudio.google.com/apikey and set it, then re-run.")

    # try the chosen model first, then fall back to the other if it's unavailable
    models = ["gemini-2.5-flash-image", "gemini-3-pro-image-preview"] if flash \
        else ["gemini-3-pro-image-preview", "gemini-2.5-flash-image"]
    client = genai.Client(api_key=key)
    out_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "assets")
    os.makedirs(out_dir, exist_ok=True)

    def render(prompt):
        for model in models:
            try:
                resp = client.models.generate_content(
                    model=model, contents=prompt,
                    config=types.GenerateContentConfig(
                        response_modalities=["IMAGE", "TEXT"],
                        image_config=types.ImageConfig(aspect_ratio="16:9"),
                    ),
                )
                for part in resp.candidates[0].content.parts:
                    if getattr(part, "inline_data", None) and part.inline_data.mime_type.startswith("image/"):
                        return part.inline_data.data, model
            except Exception as e:
                print(f"  ({model} failed: {e}) — trying fallback ...")
        return None, None

    ok = 0
    for name, prompt in ASSETS.items():
        print(f"\nGenerating {name} ...")
        data, used = render(prompt)
        if not data:
            print(f"  !! no image produced for {name}")
            continue
        path = os.path.join(out_dir, f"{name}.png")
        with open(path, "wb") as f:
            f.write(data)
        print(f"  saved -> {path}   [{used}]")
        ok += 1

    print(f"\nDone — {ok}/{len(ASSETS)} renders saved.  Reload the Portfolio and open each chamber.")

if __name__ == "__main__":
    main()
