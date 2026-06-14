#!/usr/bin/env python3
"""Generate PRODUCTION-PACKAGE.md and IMAGE-PROMPTS.json for Abstract 1 documentary."""

import json
from pathlib import Path

STYLE = (
    "Cinematic 16:9 documentary, photorealistic, subtle sci-fi, "
    "deep teal and gold accents, dramatic lighting, no text, no watermark, 4K"
)

# Each entry: (narration, visual_prompt, tier)
# tier: CONFIRMED | INTERPRETATION | CONJECTURE
SEGMENTS = [
    # ACT 1 — HOOK (001-012)
    ("What if everything you touch is not made of stuff at all?", "Human hand reaching toward floating particles dissolving into cascading binary code streams", "INTERPRETATION"),
    ("For thousands of years, humanity assumed solid, uncuttable things.", "Ancient Greek philosophers in marble colonnade examining clay atom models", "CONFIRMED"),
    ("Atoms meant indivisible. Solidity felt like baseline reality.", "Close-up of stone surface cracking to reveal geometric crystal lattice beneath", "CONFIRMED"),
    ("Information was something we wrote on paper — after physics existed.", "Medieval scribe at candlelit desk, ink transforming into glowing data streams", "CONFIRMED"),
    ("Then the twentieth century cracked that picture through experiments.", "1920s physics laboratory with brass instruments, electrical arcs, and glass tubes", "CONFIRMED"),
    ("Quantum mechanics: different questions yielded different answers.", "Double-slit experiment visualization with interference pattern forming on screen", "CONFIRMED"),
    ("Relativity replaced absolute space with invariant relationships.", "Einstein-era chalkboard covered in tensor equations bending spacetime grid", "CONFIRMED"),
    ("Thermodynamics linked entropy to the number of possible microstates.", "Victorian steam engine diagram morphing into statistical probability cloud", "CONFIRMED"),
    ("Each development pushed physics toward relationships and constraints.", "Timeline montage of physics milestones dissolving into network graph", "CONFIRMED"),
    ("The vocabulary of information — long before anyone used that word.", "Vintage physics journals with equations highlighted as information symbols", "CONFIRMED"),
    ("Imagine peeling an onion and finding rules, not materials.", "Hands peeling translucent onion layers revealing glowing code beneath each skin", "INTERPRETATION"),
    ("What if the innermost layer is code all the way down?", "Infinite zoom into fractal code structure with dimensional depth layers", "INTERPRETATION"),

    # ACT 2 — WHEELER / IT FROM BIT (013-030)
    ("John Archibald Wheeler worked with Bohr and named black holes.", "Portrait-style scene of Wheeler at blackboard with gravitational diagrams", "CONFIRMED"),
    ("He spent his later career on a radical proposal: It from Bit.", "Wheeler lecturing, chalk writing IT FROM BIT in bold letters", "CONFIRMED"),
    ("Not the particle, but the bit — a yes-or-no from measurement.", "Quantum measurement apparatus with binary 0 and 1 outcomes glowing", "CONFIRMED"),
    ("Every it — every particle, field, or event — derives from information.", "Particle collision dissolving into streams of binary digits", "INTERPRETATION"),
    ("Wheeler was not claiming laptops simulate the cosmos.", "Modern laptop contrasted with vast cosmic nebula, scale comparison", "CONFIRMED"),
    ("He pointed to a structural parallel in quantum mechanics.", "Side-by-side: quantum state diagram and algorithmic flowchart", "CONFIRMED"),
    ("Measurements yield discrete outcomes. Laws connect them algorithmically.", "Quantum measurement sequence displayed as step-by-step algorithm", "CONFIRMED"),
    ("Participatory observation: the universe resolves state on query.", "Observer figure triggering wavefunction collapse into definite state", "INTERPRETATION"),
    ("Whether you accept that metaphysics or not, Wheeler gave us the slogan.", "Bold typography IT FROM BIT floating in cosmic void", "CONFIRMED"),
    ("And an honest warning: this is a research direction, not finished doctrine.", "Scientific caution sign overlaid on research laboratory", "CONFIRMED"),
    ("The WeAD framework extends Wheeler into systems language.", "Layered software architecture diagram mapped onto cosmic dimensions", "INTERPRETATION"),
    ("Dimensions as layered code. Higher layers with read-write access.", "Stacked transparent dimensional planes with permission arrows between layers", "CONJECTURE"),
    ("That extension is speculative. Wheeler never claimed a recipe for editing spacetime.", "Wheeler portrait fading into question marks over physics equations", "CONFIRMED"),
    ("The documentary question his work leaves open is precise.", "Documentary filmmaker silhouette before vast physics archive", "CONFIRMED"),
    ("How much of physics is ontology — what truly exists?", "Split screen: philosophical question marks vs laboratory equipment", "INTERPRETATION"),
    ("And how much is epistemology dressed in binary?", "Binary code rain over human eye reflecting scientific instruments", "INTERPRETATION"),
    ("Wheeler gave information-first physics its most famous slogan.", "Cosmic panorama with IT FROM BIT etched in starlight", "CONFIRMED"),

    # ACT 3 — DIGITAL SIGNATURES (031-060)
    ("Several features of nature look analog until you inspect them closely.", "Smooth ocean wave transitioning to pixelated digital grid on zoom", "CONFIRMED"),
    ("Then they look digital. Quantization is the first signature.", "Energy levels diagram showing discrete quantum jumps not continuous spectrum", "CONFIRMED"),
    ("Energy, charge, and angular momentum come in discrete units.", "Photon emission as distinct packets not dimmer switch gradient", "CONFIRMED"),
    ("Planck's nineteen-oh-oh quantization of blackbody radiation began it.", "Max Planck at historical blackbody radiation experiment apparatus", "CONFIRMED"),
    ("A photon is not a dimmer switch. It is a packet.", "Single photon striking detector as discrete flash of light", "CONFIRMED"),
    ("The Planck length: one point six one six times ten to negative thirty-five meters.", "Scale visualization zooming to impossibly tiny Planck length marker", "CONFIRMED"),
    ("Below this scale, where and when may cease to mean anything.", "Spacetime grid dissolving into formless quantum foam at Planck scale", "INTERPRETATION"),
    ("Suggestive of a finite-resolution substrate — though unproven directly.", "Pixel grid underlying smooth spacetime fabric, labeled as theoretical", "INTERPRETATION"),
    ("Bekenstein's nineteen seventy-three black hole entropy shocked physicists.", "Black hole with information-encoded event horizon glowing", "CONFIRMED"),
    ("Entropy proportional to horizon area — not volume.", "Black hole cross-section showing area scaling vs volume comparison", "CONFIRMED"),
    ("A region of space has a maximum information capacity.", "Holographic boundary sphere containing maximum bit count visualization", "CONFIRMED"),
    ("A cap on bits — not an unlimited bucket of stuff.", "Overflowing digital storage meter hitting hard capacity limit", "CONFIRMED"),
    ("Hawking radiation confirmed black holes carry thermodynamic entropy.", "Hawking radiation particles escaping black hole event horizon", "CONFIRMED"),
    ("Quantum contextuality: results depend on measurement context.", "Kochen-Specker geometric diagram with context-dependent outcomes", "CONFIRMED"),
    ("The value may not exist until the right API is called.", "Software API call metaphor with quantum measurement interface", "INTERPRETATION"),
    ("None of these facts alone proves the universe is a computer.", "Balanced scale weighing evidence for and against digital universe", "CONFIRMED"),
    ("Together they motivate the central question.", "Multiple physics evidence streams converging on single question mark", "CONFIRMED"),
    ("What if continuity is compiled output from discrete processes?", "Smooth rendered landscape revealed as output from underlying code compiler", "INTERPRETATION"),
    ("The holographic principle: information on a boundary encodes a volume.", "2D holographic surface projecting full 3D universe from its boundary", "CONFIRMED"),
    ("Developed by t Hooft, Susskind, and Bousso among others.", "Three physicists' silhouettes before holographic principle diagram", "CONFIRMED"),
    ("AdS/CFT: Maldacena's nineteen ninety-seven correspondence.", "Anti-de Sitter bulk space connected to boundary conformal field theory", "CONFIRMED"),
    ("A gravitational theory in a bulk equals a field theory on its boundary.", "Mathematical equivalence bridge between two theoretical frameworks", "CONFIRMED"),
    ("One of the strongest statements that dimensionality may be emergent.", "Dimensions emerging like rendered layers from lower-dimensional source code", "INTERPRETATION"),
    ("Lower-dimensional code generating higher-dimensional phenomenology.", "2D code matrix expanding into rich 3D experiential environment", "INTERPRETATION"),
    ("The ER equals EPR conjecture pushes further still.", "Entangled particles connected by wormhole geometry visualization", "CONFIRMED"),
    ("Entanglement and spatial connectivity as two descriptions of the same structure.", "Dual view: quantum entanglement network and spacetime fabric", "INTERPRETATION"),
    ("Spacetime itself may be stitched from quantum correlations.", "Spacetime fabric woven from threads of quantum entanglement", "CONJECTURE"),
    ("Verlinde's entropic gravity: attraction as thermodynamic response.", "Gravity visualized as thermodynamic information flow on holographic screen", "INTERPRETATION"),
    ("If gravity is emergent from information dynamics, daily experience changes.", "Person walking on Earth with gravity shown as statistical information summary", "INTERPRETATION"),
    ("Temperature is not microscopic — it is an aggregate. Gravity may be too.", "Thermometer and gravitational field shown as parallel emergent phenomena", "INTERPRETATION"),

    # ACT 4 — THERMODYNAMICS & LINEAGE (061-078)
    ("If information were mere bookkeeping, erasing a bit would cost nothing.", "Person casually deleting file with no energy consequence, then corrected", "CONFIRMED"),
    ("Landauer proved otherwise in nineteen sixty-one.", "Rolf Landauer at IBM research with information thermodynamics equations", "CONFIRMED"),
    ("Logically irreversible erasure dissipates at least k-T ln two of heat.", "Heat dissipation visualization from single bit erasure event", "CONFIRMED"),
    ("Bérut and collaborators verified it experimentally in Nature, twenty twelve.", "Colloidal particle experiment measuring heat from information erasure", "CONFIRMED"),
    ("Information is not ghostwriting on matter. It is part of the energy ledger.", "Energy accounting ledger with information entries alongside matter entries", "CONFIRMED"),
    ("Shannon's nineteen forty-eight theory gave information its modern form.", "Claude Shannon with communication channel and entropy equations", "CONFIRMED"),
    ("Entropy as uncertainty. Channels with capacity limits.", "Information channel with noise, capacity bar, and error correction", "CONFIRMED"),
    ("Jacobson derived Einstein's equations from thermodynamic relations.", "Einstein field equations emerging from thermodynamic horizon relations", "CONFIRMED"),
    ("Geometry itself may be a macroscopic summary of micro-informational processes.", "Spacetime curvature emerging from microscopic information transactions", "INTERPRETATION"),
    ("Wheeler was not alone. Zuse proposed Calculating Space in nineteen sixty-nine.", "Konrad Zuse with early computer and cellular automaton grid", "CONFIRMED"),
    ("The universe computed by a cellular automaton.", "Cellular automaton rules generating complex cosmic patterns", "INTERPRETATION"),
    ("Fredkin developed digital physics in the eighties and nineties.", "Edward Fredkin before discrete informational spacetime model", "CONFIRMED"),
    ("Wolfram explored computational irreducibility and simple rules.", "Stephen Wolfram cellular automata producing complex emergent behavior", "CONFIRMED"),
    ("t Hooft's cellular automaton interpretation of quantum mechanics.", "Nobel laureate Gerard t Hooft with quantum automaton model diagrams", "CONFIRMED"),
    ("Serious physics by a Nobel laureate — not internet speculation.", "Peer-reviewed journal stack contrasted with anonymous online forum", "CONFIRMED"),
    ("Seth Lloyd: the cosmos processes information through quantum computation.", "Universe as quantum computer with operation count since Big Bang", "INTERPRETATION"),
    ("Max Tegmark's Mathematical Universe Hypothesis: reality is mathematical structure.", "Mathematical equations forming the fabric of physical reality", "INTERPRETATION"),
    ("The deepest layer may not be material grain but formal structure.", "Matter dissolving to reveal pure mathematical structure beneath", "INTERPRETATION"),

    # ACT 5 — IMPLICATIONS (079-102)
    ("The map is not the territory. Information math does not prove ontology.", "Cartographer's map overlaid on actual landscape showing the gap", "CONFIRMED"),
    ("No experiment has decisively chosen information-first over matter-first.", "Laboratory fork in road with two ontological paths both open", "CONFIRMED"),
    ("If the conservative core is correct, the frontier shifts.", "Scientific frontier shifting from brute force to protocol discovery", "INTERPRETATION"),
    ("Physical law is about how information is stored, transformed, and recovered.", "Information lifecycle diagram within physical law constraints", "CONFIRMED"),
    ("You do not need to melt a server to read a record. You need the right query.", "Database server intact while correct query retrieves glowing data record", "INTERPRETATION"),
    ("The WeAD programme treats chemistry and quantum computation as interfaces.", "Chemistry lab and quantum computer as progressive query interfaces to reality", "CONJECTURE"),
    ("If reality is information-based, manipulating spacetime changes.", "Spacetime parameter panel with gravity slider being adjusted", "CONJECTURE"),
    ("Brute-force energy may not be required — access to code may suffice.", "Massive power plant contrasted with elegant code access terminal", "CONJECTURE"),
    ("You do not need a million watts to change gravity from nine point eight to zero.", "Gravity constant displayed as editable code parameter gravity equals zero", "CONJECTURE"),
    ("You would need permission and knowledge of the system.", "Locked system architecture with permission hierarchy and access keys", "CONJECTURE"),
    ("Ancient texts describe beings manipulating reality without visible energy.", "Ancient manuscript illustrations of luminous beings altering physical reality", "INTERPRETATION"),
    ("They may operate at a layer of code above everyday physics.", "Dimensional layer diagram with beings accessing higher code permissions", "CONJECTURE"),
    ("UAP phenomena — morphing, shape-shifting, defying inertia — labeled conjecture.", "UAP silhouette with CONJECTURE label, parameter modification overlay", "CONJECTURE"),
    ("Consistent with parameter modification rather than force application.", "Physics simulation with parameters changed vs force vectors applied", "CONJECTURE"),
    ("This implication is extraordinary and unsupported by controlled experiment.", "Empty laboratory with extraordinary claim stamped UNVERIFIED", "CONFIRMED"),
    ("It should be labeled conjecture — not corollary.", "Scientific labeling system distinguishing proven from speculative claims", "CONFIRMED"),
    ("What would falsify the strong claim?", "Falsification checklist on scientific blackboard", "CONFIRMED"),
    ("Black hole entropy scaling failure. Landauer bound breakdown.", "Two falsification test scenarios illustrated side by side", "CONFIRMED"),
    ("A local hidden-variable completion removing contextuality.", "Bell test experiment with hidden variable hypothesis crossed out", "CONFIRMED"),
    ("Continued null results on digital signature experiments.", "Holometer-style interferometer showing null detection result", "CONFIRMED"),
    ("What would support it? Positive detection of discrete spacetime signatures.", "Future experiment detecting pixelated spacetime signature, positive result", "CONFIRMED"),
    ("An emergent-gravity framework with unique confirmed predictions.", "Verlinde-style emergent gravity with confirmed experimental prediction", "INTERPRETATION"),
    ("Or an information-theoretic derivation of Standard Model parameters.", "Standard Model parameters derived from information theory equations", "CONJECTURE"),
    ("Philosophically, ancient layered cosmologies gain new framing.", "Ancient cosmology diagram beside modern dimensional layer architecture", "INTERPRETATION"),

    # ACT 6 — CLOSE (103-120)
    ("Not as pre-scientific error — but as mnemonic compressions of structural intuition.", "Ancient cosmological art reframed as information architecture mnemonic", "INTERPRETATION"),
    ("Reality may be stratified. Deeper layers encode what shallower layers display.", "Layered reality stack with encoding relationship between depth levels", "INTERPRETATION"),
    ("That reframing is hermeneutic. It is not proof.", "Interpretive lens over ancient text, clearly labeled not proof", "CONFIRMED"),
    ("Craig Hogan predicted measurable holographic noise in spacetime.", "Craig Hogan with holographic noise prediction equations", "CONFIRMED"),
    ("The Fermilab Holometer searched for it in twenty fifteen.", "Fermilab Holometer interferometer interior, laser beams crossing", "CONFIRMED"),
    ("It found none at the tested scale.", "Interferometer display showing flat null-result signal line", "CONFIRMED"),
    ("That does not refute all information-based models.", "Nuanced scale showing constrained but not eliminated hypothesis space", "CONFIRMED"),
    ("But it constrains naive pixelated spacetime stories.", "Pixelated spacetime model with constraint boundary marked", "CONFIRMED"),
    ("Continuity still works. Field theories use continuous manifolds.", "Continuous differential geometry governing quantum field theory", "CONFIRMED"),
    ("Discrete approaches must recover Lorentz symmetry and precision tests.", "Lorentz symmetry and Standard Model precision tests as recovery bar", "CONFIRMED"),
    ("Humanity's trajectory aligns: quantum information, error correction, tensor networks.", "Montage of quantum computing, error correction, and tensor network research", "CONFIRMED"),
    ("Understanding the universe as a system that processes information.", "Universe as information processing system with physical law constraints", "INTERPRETATION"),
    ("The stakes: are our tools calculators about reality — or interfaces into it?", "Calculator vs interface metaphor with diverging future paths", "INTERPRETATION"),
    ("The honest middle path: pursue the interface hypothesis with discipline.", "Scientist at work with rigor checklist: measure, publish, invite falsification", "CONFIRMED"),
    ("Never confuse a compelling story with a confirmed one.", "Compelling narrative book beside confirmed experimental result certificate", "CONFIRMED"),
    ("Reading the code — not smashing it — is the frontier.", "Gentle code reading interface vs destructive particle collision accelerator", "INTERPRETATION"),
    ("Abstract One asked whether information is primary. The evidence is real.", "Abstract 01 title card with evidence tier summary badges", "CONFIRMED"),
    ("The synthesis awaits tests that go beyond metaphor.", "Future experiment horizon with open research questions", "CONFIRMED"),
    ("Next: Abstract Two — The Book of Enoch as System Architecture.", "Teaser frame: seven heavens as layered system architecture diagram", "INTERPRETATION"),
]


def timecode(index: int) -> str:
    total_seconds = (index - 1) * 5
    minutes = total_seconds // 60
    seconds = total_seconds % 60
    return f"{minutes}:{seconds:02d}"


def act_for(index: int) -> int:
    if index <= 12:
        return 1
    if index <= 29:
        return 2
    if index <= 59:
        return 3
    if index <= 77:
        return 4
    if index <= 101:
        return 5
    return 6


ACT_NAMES = {
    1: "Hook — From Matter to Message",
    2: "It from Bit — Wheeler's Radical Proposal",
    3: "Digital Signatures in the Fabric of Physics",
    4: "Thermodynamics & The Digital Physics Lineage",
    5: "Implications — Reading, Not Smashing, the Code",
    6: "Honest Limits & Close",
}


def build_prompts():
    entries = []
    for i, (narration, visual, tier) in enumerate(SEGMENTS, start=1):
        entries.append({
            "id": f"{i:03d}",
            "filename": f"abstract-01-{i:03d}.png",
            "time": timecode(i),
            "time_end": timecode(i + 1) if i < 120 else "10:00",
            "act": act_for(i),
            "act_name": ACT_NAMES[act_for(i)],
            "narration": narration,
            "visual": visual,
            "prompt": f"{visual}. {STYLE}",
            "tier": tier,
        })
    return entries


def build_markdown(entries):
    lines = [
        "# Abstract 01 — Reality as Information-Based Code",
        "## Documentary Production Package",
        "",
        "| Item | Detail |",
        "|------|--------|",
        "| **Runtime** | 10:00 exactly |",
        "| **Images** | 120 (one every 5.00 seconds) |",
        "| **Narration** | ~1,400 words at ~140 WPM |",
        "| **Structure** | 6 acts |",
        "| **Source** | [wead.live/theoretical-abstracts](https://wead.live/theoretical-abstracts) Abstract #1 |",
        "",
        "### Fact Tier Legend",
        "- **CONFIRMED** — Established physics or documented history",
        "- **INTERPRETATION** — Valid reading of evidence, not proven ontology",
        "- **CONJECTURE** — Speculative WeAD extension, clearly labeled",
        "",
        "### Global Image Style Suffix",
        f"```\n{STYLE}\n```",
        "",
        "### Music Direction",
        "- Acts 1–2: Ambient tension, low strings, subtle pulse",
        "- Act 3: Building momentum, electronic textures under orchestral swells",
        "- Act 4: Intellectual curiosity, piano and light percussion",
        "- Act 5: Cinematic weight, brass accents for implications; dial back for conjecture",
        "- Act 6: Resolve to contemplative, hopeful close; teaser sting for Abstract 2",
        "",
        "### Edit Notes",
        "- Hard cut every 5.00 seconds — no crossfades between images",
        "- Optional Ken Burns: max 3% zoom per clip, consistent direction",
        "- Crop generated images to 16:9 if square",
        "- Lower-third tier labels optional for CONJECTURE segments only",
        "",
        "### YouTube Metadata",
        "**Title:** Is Reality Made of Code? | WeAD Theoretical Abstracts #1",
        "",
        "**Description:** A 10-minute documentary journey through Abstract 1 of the WeAD Theoretical Abstracts — from Wheeler's \"It from Bit\" to holographic physics, Landauer thermodynamics, and the honest limits of the information-first universe. Based on published research at wead.live.",
        "",
        "**Chapters:**",
    ]
    chapter_times = {1: "0:00", 2: "1:00", 3: "2:30", 4: "5:00", 5: "6:30", 6: "8:30"}
    for act_num, act_name in ACT_NAMES.items():
        lines.append(f"- {chapter_times[act_num]} Act {act_num}: {act_name}")

    lines.extend(["", "---", ""])
    current_act = 0
    for e in entries:
        if e["act"] != current_act:
            current_act = e["act"]
            lines.append(f"## Act {current_act}: {ACT_NAMES[current_act]}")
            lines.append("")
        lines.append(f"### IMAGE {e['id']} — {e['time']}–{e['time_end']} [{e['tier']}]")
        lines.append(f"**NARRATION:** {e['narration']}")
        lines.append(f"**VISUAL:** {e['visual']}")
        lines.append(f"**PROMPT:** {e['prompt']}")
        lines.append("")
    return "\n".join(lines)


def main():
    out_dir = Path(__file__).parent
    entries = build_prompts()
    assert len(entries) == 120, f"Expected 120 segments, got {len(entries)}"

    prompts_path = out_dir / "IMAGE-PROMPTS.json"
    with open(prompts_path, "w", encoding="utf-8") as f:
        json.dump({
            "abstract": 1,
            "title": "Reality as Information-Based Code",
            "runtime_seconds": 600,
            "image_count": 120,
            "interval_seconds": 5,
            "style_suffix": STYLE,
            "images": entries,
        }, f, indent=2, ensure_ascii=False)

    md_path = out_dir / "PRODUCTION-PACKAGE.md"
    md_path.write_text(build_markdown(entries), encoding="utf-8")
    print(f"Wrote {prompts_path} ({len(entries)} prompts)")
    print(f"Wrote {md_path}")


if __name__ == "__main__":
    main()
