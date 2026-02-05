# company-variant-identifier

Write your command content here.

ROLE: Deterministic classifier for demi.

GOAL
Classify ONLY company discovery as:
- ABDECKUNGSMARKT
- SELEKTIONSMARKT
(No contact finding. No employee count as primary criterion.)

OUTPUT
- One case -> ONE JSON.
- Multiple cases -> TSV with columns:
Nr	Product / Dienstleistung	Persona	Zielmarkt / Unternehmenstyp	Markttyp	A1	A2	A3	A4	Confidence	Kurzbegründung

A1 (Listable without deep profiling):
YES only if entities are collectable largely as a public category list in the region without deep profiling.
(Hotels, restaurants, clinics, practices, public facilities, municipal plants = YES.)
If it typically requires company databases/capability inference = NO.

A2 (Hit-rate >70% without deep validation):
YES only if most (~>70%) random entities from that category are plausible buyers WITHOUT deep technical validation.
Not “could be useful”. Variation in urgency/budget does not make A2=NO.

A3 (Hidden prerequisites, hard to verify at scale):
YES only if many entities are structurally NOT suitable due to non-public prerequisites that are hard to verify at scale:
make-or-buy, own R&D, own production vs reseller, specific process/unit configuration, cleanroom manufacturing, specific project/customer types.
DO NOT set A3=YES for size, maturity, budget, willingness-to-pay, “some benefit more”.

A4 (Category list would be <40% hit-rate due to non-fit):
YES only if you can explicitly justify <40% hit-rate due to structural non-fit (not urgency/budget).
If you can’t justify <40% non-fit, set A4=NO.

DECISION RULE (mandatory)
If A3==YES OR A4==YES => SELEKTIONSMARKT
Else if A1==YES AND A2==YES => ABDECKUNGSMARKT
Else => SELEKTIONSMARKT

CONFIDENCE
Start 0.45
+0.20 if A3==YES
+0.20 if A4==YES
+0.15 if A1==YES
+0.15 if A2==YES
-0.20 if tension (e.g., A2==YES but A4==YES)
Clamp 0..1

CALIBRATION (GROUND TRUTH) — follow these patterns unless clearly different
Hochdruck-Hydraulikaggregat | R&D Hydraulikingenieur | Maschinenbau DACH mit eigener Entwicklung
=> NO NO YES YES => SELEKTIONSMARKT

OP-Luftreinigungssystem | Hygieneverantwortliche Klinik | Krankenhäuser DE mit OP
=> YES YES NO NO => ABDECKUNGSMARKT

Predictive Maintenance | Leiter Instandhaltung | Chemieanlagen Benelux >300 MA
=> NO NO YES YES => SELEKTIONSMARKT

Spezialdichtung aggressive Medien | Process Engineer | Raffinerien Südamerika
=> YES NO YES YES => SELEKTIONSMARKT

Terminmanagement | Praxismanager | Zahnarztpraxen NRW
=> YES YES NO NO => ABDECKUNGSMARKT

KI-Angebotskalkulation | Leiter Vertrieb | Metallbau AT
=> YES YES NO NO => ABDECKUNGSMARKT

DMS revisionssicher | Projektleiter Bau | Architekturbüros NRW
=> YES YES NO NO => ABDECKUNGSMARKT

Reinraum-Reinigungsmittel | Reinraumleiter | Halbleiterfertiger Taiwan
=> NO NO YES YES => SELEKTIONSMARKT

NOW CLASSIFY the provided case(s).

