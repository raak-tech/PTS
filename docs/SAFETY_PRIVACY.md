# Safety & Privacy (Draft)

This is a *therapy-adjacent* product exploration. We will default to conservative safety boundaries.

## Scope boundaries (draft)
- Not a replacement for medical advice.
- No emergency use: crisis content should route to local emergency resources.
- Avoid diagnosing or prescribing.

### Musculoskeletal chronic pain: additional safety boundaries
This product may discuss musculoskeletal pain, movement, and self-management habits. It must:

- **Not diagnose** conditions (e.g., herniated disc, fracture, infection, cancer) or claim certainty.
- **Not prescribe** medications, doses, tapering plans, or substitute for clinician-directed care.
- **Not provide emergency instructions** beyond directing users to local emergency services.
- **Not guarantee outcomes** (pain reduction, functional improvement, healing timelines).
- **Default to conservative guidance** when safety is unclear: recommend in-person evaluation.
- **Encourage shared decision-making**: “If you’re unsure, contact a licensed clinician.”

Permitted (examples): general education about chronic pain concepts, pacing, sleep basics, gentle movement suggestions, question prompts to discuss with a clinician.

Not permitted (examples): “You have X,” “You don’t need a doctor,” “Stop/start/change this medicine,” “This will fix your pain.”

## Red flags & routing (musculoskeletal)
We use a simple safety screen. If any **red flags** are present, the app must stop the coaching flow and show **/red-flags** guidance.

### Routing decision table

| Condition | App action |
|---|---|
| **Any red flag present** (user reports “yes” or describes symptoms matching a red flag) | Route to **/red-flags** page (high-salience). Do not provide exercise/behavioral recommendations beyond “seek urgent care.” |
| **No red flags present** | Proceed with general education and non-medical self-management support. Continue to remind: not medical advice; stop and seek care if symptoms worsen/new red flags appear. |

### Musculoskeletal red flags (draft list)
Use plain-language screening; do not imply diagnosis. Examples include:

**Emergency / urgent (route to emergency services now):**
- **New severe weakness, numbness, or loss of coordination** in an arm/leg; symptoms rapidly worsening.
- **Loss of bowel or bladder control**, new urinary retention, or **numbness in the groin/saddle area**.
- **Severe pain after a major fall/accident**, or obvious deformity; inability to bear weight after trauma.
- **Back/neck pain with fever** or feeling very unwell, especially with spinal tenderness.
- **Chest pain, shortness of breath, fainting**, or pain radiating to jaw/left arm (even if user thinks it’s “muscle”).
- **One-sided leg swelling, redness, warmth, and pain**, especially with shortness of breath (possible clot).

**Same-day / prompt medical evaluation (urgent care/clinician):**
- **Fever**, chills, night sweats, or signs of infection with new/worsening back, neck, or joint pain.
- **History of cancer**, unexplained weight loss, or night pain that is new and not relieved by rest.
- **Immunosuppression** (e.g., chemo, high-dose steroids), **IV drug use**, or recent serious infection with new spinal pain.
- **New pain after minor trauma** in someone with osteoporosis/older age, or long-term steroid use.
- **Progressive neurologic symptoms**: increasing numbness/tingling, spreading weakness, new foot drop.
- **Hot, swollen, red joint** with limited motion (especially with fever).
- **Severe unrelenting pain** that is rapidly worsening or preventing basic self-care.

Implementation note: free-text may contain red-flag descriptions even if a checkbox screen is “no.” If using NLP classification, default to routing when confidence is moderate/high.

## /red-flags route copy (draft)
**Title:** Safety check — you may need urgent medical care

**Body (suggested):**
> Based on what you shared, some symptoms can be signs of a condition that needs **urgent in-person medical evaluation**.
>
> I can’t diagnose problems or tell you what’s happening, and this app is **not for emergencies**.

**What to do now:**
- If you think this is an emergency or symptoms are severe/worsening, **call your local emergency number (e.g., 911/112)** or go to the nearest emergency department.
- If it’s not an emergency but you have new concerning symptoms, **seek same-day care** (urgent care/primary care) or contact your clinician.

**Seek emergency care now** if you have any of the following:
- Loss of bowel/bladder control, new urinary retention, or numbness in the groin/saddle area
- New severe weakness/numbness, trouble walking, or rapidly worsening symptoms
- Severe pain after an accident/fall, obvious deformity, or inability to bear weight
- Fever with new severe back/neck/joint pain, or you feel very unwell
- Chest pain, trouble breathing, fainting
- One-sided leg swelling/redness/warmth (especially with shortness of breath)

**Continue only after you’re safe:**
> If you’re evaluated by a clinician and cleared to continue self-management, you can come back and we’ll focus on general support.

## Privacy notes specific to red-flag screening
- **Do not store red-flag answers by default.** Treat these as highly sensitive. Prefer on-device/ephemeral evaluation.
- If storing is required (analytics, continuity), require **explicit opt-in consent** and clearly explain:
  - what is stored (e.g., yes/no flags vs full text),
  - retention period,
  - who can access it,
  - how to delete it.
- Avoid logging raw user-entered symptom text in server logs.

## Data minimization (default)
- Collect the minimum data required for the product to function.
- Prefer on-device / ephemeral processing where possible.
- Explicit user consent for any sensitive data collection.

## Sensitive content handling
- Clearly label what the system can/can't do.
- Provide escalation paths: call therapist, seek care, emergency.

## Security baseline (eventual)
- Encryption in transit (TLS) and at rest.
- Access controls + audit logs.
- Secrets management (no secrets in git).

## Open questions
- Do we store session transcripts at all?
- If we store, what retention period?
- Do we need consent flows for clinical notes vs wellness coaching?
