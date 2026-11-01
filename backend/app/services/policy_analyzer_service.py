"""
FineGuard - Insurance Policy Document & Clause Scanner Service
Student-Engineered High-Precision Text Extraction & Clause Tokenizer using PyPDF.
Extracts verbatim lines from uploaded PDFs with exact page citations,
filters Table of Contents/definitions to prevent false page matches,
evaluates 12 critical IRDAI insurance categories, and provides official company purchase portals.
"""

import io
import re
from typing import Dict, Any, List, Optional
from pypdf import PdfReader

# Comprehensive Registry of Verified Indian Insurers & Official Direct Portals
INSURER_REGISTRY = [
    {
        "keywords": ["hdfc ergo", "optima secure", "optima restore", "my:health suraksha", "hdfc general insurance"],
        "company_name": "HDFC ERGO General Insurance",
        "plan_name": "Optima Secure Health Plan",
        "company_website": "https://www.hdfcergo.com/health-insurance",
        "irdai_claim_settlement_ratio": "98.2%",
        "incurred_claims_ratio": "64.8%",
        "base_rating": 9.0,
    },
    {
        "keywords": ["star health and allied", "star health", "family health optima", "young star insurance", "star cardiac", "star women care"],
        "company_name": "Star Health & Allied Insurance",
        "plan_name": "Comprehensive Health Insurance Policy",
        "company_website": "https://www.starhealth.in/",
        "irdai_claim_settlement_ratio": "94.5%",
        "incurred_claims_ratio": "68.2%",
        "base_rating": 7.8,
    },
    {
        "keywords": ["care health insurance", "care health", "care supreme", "care advantage", "care shield", "religare health"],
        "company_name": "Care Health Insurance",
        "plan_name": "Care Supreme Health Plan",
        "company_website": "https://www.careinsurance.com/",
        "irdai_claim_settlement_ratio": "95.6%",
        "incurred_claims_ratio": "61.4%",
        "base_rating": 8.5,
    },
    {
        "keywords": ["niva bupa", "max bupa", "reassure 2.0", "reassure", "health companion"],
        "company_name": "Niva Bupa Health Insurance",
        "plan_name": "ReAssure 2.0 Health Plan",
        "company_website": "https://www.nivabupa.com/",
        "irdai_claim_settlement_ratio": "92.8%",
        "incurred_claims_ratio": "59.7%",
        "base_rating": 8.2,
    },
    {
        "keywords": ["icici lombard", "health advantedge", "elevate health", "complete health insurance"],
        "company_name": "ICICI Lombard General Insurance",
        "plan_name": "Complete Health Insurance",
        "company_website": "https://www.icicilombard.com/health-insurance",
        "irdai_claim_settlement_ratio": "97.4%",
        "incurred_claims_ratio": "66.5%",
        "base_rating": 8.7,
    },
    {
        "keywords": ["bajaj allianz", "health guard", "extra care plus"],
        "company_name": "Bajaj Allianz General Insurance",
        "plan_name": "Health Guard Individual & Family",
        "company_website": "https://www.bajajallianz.com/health-insurance-plans.html",
        "irdai_claim_settlement_ratio": "98.1%",
        "incurred_claims_ratio": "67.0%",
        "base_rating": 8.6,
    },
    {
        "keywords": ["tata aig", "medicare premier", "medicare plus", "medicare"],
        "company_name": "Tata AIG General Insurance",
        "plan_name": "MediCare Premier Health Plan",
        "company_website": "https://www.tataaig.com/health-insurance",
        "irdai_claim_settlement_ratio": "96.1%",
        "incurred_claims_ratio": "63.0%",
        "base_rating": 8.4,
    },
    {
        "keywords": ["sbi general insurance", "sbi general", "arogya supreme", "arogya premier", "arogya sanjeevani sbi"],
        "company_name": "SBI General Insurance",
        "plan_name": "Arogya Supreme Health Policy",
        "company_website": "https://www.sbigeneral.in/health-insurance",
        "irdai_claim_settlement_ratio": "95.1%",
        "incurred_claims_ratio": "62.4%",
        "base_rating": 8.0,
    },
    {
        "keywords": ["new india assurance", "new india", "yuva bharat", "mediclaim 2012"],
        "company_name": "The New India Assurance Co. Ltd.",
        "plan_name": "Yuva Bharat / Premier Mediclaim",
        "company_website": "https://www.newindia.co.in/",
        "irdai_claim_settlement_ratio": "93.4%",
        "incurred_claims_ratio": "89.2%",
        "base_rating": 7.9,
    },
    {
        "keywords": ["national insurance company", "national insurance", "national mediclaim", "national parivar"],
        "company_name": "National Insurance Company Limited",
        "plan_name": "National Parivar Mediclaim Plus",
        "company_website": "https://nationalinsurance.nic.co.in/",
        "irdai_claim_settlement_ratio": "91.8%",
        "incurred_claims_ratio": "87.5%",
        "base_rating": 7.7,
    },
    {
        "keywords": ["oriental insurance", "oriental mediclaim", "oriental happy family"],
        "company_name": "The Oriental Insurance Company",
        "plan_name": "Oriental Happy Family Floater",
        "company_website": "https://orientalinsurance.org.in/",
        "irdai_claim_settlement_ratio": "92.1%",
        "incurred_claims_ratio": "86.1%",
        "base_rating": 7.8,
    },
    {
        "keywords": ["united india insurance", "united india", "uni mediclaim"],
        "company_name": "United India Insurance Company",
        "plan_name": "Uni Individual / Family Health Insurance",
        "company_website": "https://uiic.co.in/",
        "irdai_claim_settlement_ratio": "92.5%",
        "incurred_claims_ratio": "85.8%",
        "base_rating": 7.8,
    },
    {
        "keywords": ["aditya birla health", "activ fit", "activ health", "activ one", "aditya birla capital"],
        "company_name": "Aditya Birla Health Insurance",
        "plan_name": "Activ One Health Plan",
        "company_website": "https://www.adityabirlacapital.com/healthinsurance/",
        "irdai_claim_settlement_ratio": "94.2%",
        "incurred_claims_ratio": "60.5%",
        "base_rating": 8.1,
    },
    {
        "keywords": ["godigit", "go digit", "digit health", "digit general insurance", "digit insurance"],
        "company_name": "Go Digit General Insurance",
        "plan_name": "Digit Health Care Plus",
        "company_website": "https://www.godigit.com/health-insurance",
        "irdai_claim_settlement_ratio": "96.8%",
        "incurred_claims_ratio": "65.2%",
        "base_rating": 8.5,
    },
    {
        "keywords": ["acko general insurance", "acko general", "acko platinum", "acko health"],
        "company_name": "Acko General Insurance",
        "plan_name": "Acko Platinum Health Plan",
        "company_website": "https://www.acko.com/health-insurance/",
        "irdai_claim_settlement_ratio": "97.0%",
        "incurred_claims_ratio": "63.8%",
        "base_rating": 8.7,
    },
    {
        "keywords": ["max life insurance", "smart secure plus", "smart secure", "max life term"],
        "company_name": "Max Life Insurance",
        "plan_name": "Smart Secure Plus Term Plan",
        "company_website": "https://www.maxlifeinsurance.com/",
        "irdai_claim_settlement_ratio": "99.5%",
        "incurred_claims_ratio": "71.2%",
        "base_rating": 9.2,
    },
    {
        "keywords": ["life insurance corporation", "lic of india", "lic arogya", "lic tech term", "lic jeevan"],
        "company_name": "Life Insurance Corporation of India (LIC)",
        "plan_name": "LIC Arogya Rakshak / Tech Term",
        "company_website": "https://licindia.in/",
        "irdai_claim_settlement_ratio": "98.5%",
        "incurred_claims_ratio": "74.1%",
        "base_rating": 8.3,
    },
    {
        "keywords": ["manipalcigna", "manipal cigna", "prohealth prime", "prohealth"],
        "company_name": "ManipalCigna Health Insurance",
        "plan_name": "ProHealth Prime Protect",
        "company_website": "https://www.manipalcigna.com/",
        "irdai_claim_settlement_ratio": "95.4%",
        "incurred_claims_ratio": "62.1%",
        "base_rating": 8.2,
    }
]

SAMPLE_POLICY_DOCS = {
    "hdfc": (
        "HDFC ERGO Optima Secure Health Insurance Policy Wordings.\n\n"
        "Section 2 - Inpatient Hospitalization Benefits:\n"
        "Section 2.1 Room Rent: The Insured Person is entitled to admission up to Single Private A/C Room "
        "without any daily capping or proportionate deduction on doctor consultation and surgery charges.\n"
        "Section 2.2 Intensive Care Unit: Intensive Care Unit (ICU) and ICCU expenses covered at actuals without any sub-limit.\n"
        "Section 2.3 Road Ambulance: Road ambulance charges covered up to Rs. 5,000 per hospitalization.\n"
        "Section 2.4 Day Care Procedures: All Day Care Procedures requiring less than 24 hours hospitalization are covered.\n"
        "Section 2.5 AYUSH Treatment: Inpatient treatment under Ayurveda, Yoga, Unani, Siddha, and Homeopathy covered up to Sum Insured.\n\n"
        "Section 3 - Cost Sharing:\n"
        "Section 3.1 Co-Payment: Nil co-payment applies across all age categories and network hospitals.\n\n"
        "Section 4 - Waiting Periods:\n"
        "Section 4.1 Initial Waiting Period: A waiting period of 30 days from policy inception applies for all illnesses except accidental injuries.\n"
        "Section 4.2 Specific Illnesses: Specific slow-growing diseases including Cataract, Hernia, and Joint Replacement covered after 24 months.\n"
        "Section 4.3 Pre-Existing Diseases: Pre-Existing Diseases (PED) are covered after a continuous waiting period of 24 months.\n\n"
        "Section 5 - Value Added Benefits:\n"
        "Section 5.1 Cumulative Bonus: 50% increase in Basic Sum Insured for each claim-free year up to a maximum of 100%.\n"
        "Section 5.2 Restoration Benefit: 100% Automatic Restoration of Basic Sum Assured triggered instantly upon exhaustion.\n"
        "Section 5.3 Pre and Post Hospitalization: Medical expenses for 60 days pre-admission and 180 days post-discharge are covered.\n\n"
        "Section 6 - Exclusions:\n"
        "Section 6.1 Permanent Exclusions: Cosmetic surgery, intentional self-injury, and experimental therapies are not covered. Hospital non-medical consumables excluded."
    ),
    "star": (
        "Star Health and Allied Insurance Company Limited - Comprehensive Health Insurance Policy Schedule.\n\n"
        "Section 2 - Coverage Terms:\n"
        "Section 2.1 Room Category: Daily Room Rent is limited to 1% of the Sum Insured per day. In the event of admission "
        "to a room category exceeding this limit, proportionate deduction shall apply across all associated medical expenses.\n"
        "Section 2.2 ICU Charges: ICU and ICCU charges covered up to a maximum of 2% of the Sum Insured per day.\n"
        "Section 2.3 Day Care Surgeries: 405 listed Day Care treatments requiring less than 24 hours covered.\n"
        "Section 2.4 AYUSH Benefit: Inpatient AYUSH treatment covered up to Rs. 15,000 per policy year.\n\n"
        "Section 3 - Cost Sharing Terms:\n"
        "Section 3.1 Mandatory Co-Payment: A co-payment of 10% shall apply on admissible claim amounts for insured persons aged 61 years and above.\n\n"
        "Section 4 - Waiting Periods:\n"
        "Section 4.1 Initial Waiting: First 30 days waiting period applies for all non-accidental illnesses.\n"
        "Section 4.2 Specified Ailments: 24 months waiting period for specified slow-growing illnesses including Cataract and Calculus.\n"
        "Section 4.3 Pre-Existing Diseases: Pre-Existing Diseases (PED) shall not be payable until thirty-six (36) months of continuous coverage have elapsed.\n\n"
        "Section 5 - Additional Benefits:\n"
        "Section 5.1 Cumulative Bonus: 10% sum insured bonus for each claim-free year up to a maximum of 100%.\n"
        "Section 5.2 Automatic Restoration: Re-charge of Sum Insured up to 100% available once per policy year for unrelated disease.\n"
        "Section 5.3 Pre/Post Hospitalization: 30 days prior to admission and 60 days following hospital discharge.\n\n"
        "Section 6 - Exclusions:\n"
        "Section 6.1 Excluded Treatments: Unproven therapies, spectacles, dental surgery unless requiring hospitalization, and non-medical consumables."
    ),
    "care": (
        "Care Health Insurance Limited - Care Supreme Policy Terms & Conditions.\n\n"
        "Section 2 - Inpatient Hospitalization:\n"
        "Section 2.1 Room Category: No sub-limit on room rent. Admission up to Single Private Room covered without proportionate penalty.\n"
        "Section 2.2 ICU Expenses: ICU charges covered at actuals without daily capping.\n"
        "Section 2.3 Day Care: All Day Care Treatments covered at actuals.\n"
        "Section 2.4 AYUSH: Inpatient treatment taken in government or accredited AYUSH hospitals covered up to Sum Insured.\n\n"
        "Section 3 - Co-Payment:\n"
        "Section 3.1 Co-Payment: Zero mandatory co-payment for all treatments across network hospitals in India.\n\n"
        "Section 4 - Waiting Periods:\n"
        "Section 4.1 Initial Moratorium: 30-day waiting period from commencement of risk for all diseases.\n"
        "Section 4.2 Specified Diseases: 24 months continuous coverage required for Cataract, Hernia, and Benign Prostatic Hypertrophy.\n"
        "Section 4.3 Pre-Existing Disease Moratorium: PED waiting period of 36 months applies before claims become admissible.\n\n"
        "Section 5 - Enhanced Benefits:\n"
        "Section 5.1 Cumulative Bonus Super: 50% cumulative bonus for every claim-free year up to 500% of sum insured.\n"
        "Section 5.2 Unlimited Recharge: Unlimited automatic reinstatement of Sum Insured available for unrelated and related illnesses.\n"
        "Section 5.3 Medical Expenses: 60 days pre-hospitalization and 180 days post-hospitalization reimbursement.\n\n"
        "Section 6 - Exclusions:\n"
        "Section 6.1 Exclusions: Cosmetic surgery, self-inflicted harm, experimental treatments, and hospital consumables excluded."
    ),
    "maxlife": (
        "Max Life Insurance Company Limited - Smart Secure Plus Term Insurance Plan Document.\n\n"
        "Section 1 - Policy Benefits:\n"
        "Section 1.1 Death Benefit: In the event of unfortunate demise of the Life Assured, 100% Sum Assured is paid immediately to the nominee.\n"
        "Section 1.2 Terminal Illness: Accelerated payout upon diagnosis of terminal illness with expected survival under 6 months.\n"
        "Section 1.3 Claim Settlement Record: Max Life holds an IRDAI audited claim settlement ratio of 99.5% for individual deaths.\n\n"
        "Section 2 - Exclusions & Terms:\n"
        "Section 2.1 Suicide Exclusion: Demise due to suicide within 12 months from policy commencement pays 80% of total premiums paid.\n"
        "Section 2.2 Grace Period: 30 days grace period for annual and semi-annual premium payment modes.\n"
        "Section 2.3 Free Look Period: 30 days free-look period for policies purchased online with full premium refund."
    )
}


def is_toc_line(line: str) -> bool:
    """Detects whether a line belongs to a Table of Contents or Index."""
    l = line.strip()
    if not l:
        return True
    # Dot leaders: "Room Rent ................. 14"
    if re.search(r'\.{3,}|\_{3,}|\-{3,}|\s{4,}\d+$', l):
        return True
    # Page references at end: "Room Category Page 12" or "Section 3.1 pg 14"
    if re.search(r'(?:page|pg\.?)\s*\d+$', l, re.I):
        return True
    # Table of contents title
    if re.match(r'^(?:table of contents|contents|index|table of benefits)\b', l, re.I):
        return True
    return False


def is_definition_sentence(s_lower: str) -> bool:
    """Detects whether a sentence is merely defining a term rather than stating operative limits."""
    definition_signals = [
        "means the amount charged",
        "means any condition",
        "shall mean",
        "is defined as",
        "refers to any",
        "has the meaning assigned",
        "means hospitalization",
        "means an institution"
    ]
    return any(sig in s_lower for sig in definition_signals)


def extract_pages_from_pdf_bytes(pdf_bytes: bytes) -> List[Dict[str, Any]]:
    """Extracts text page by page from raw PDF bytes up to 50 pages."""
    pages_data = []
    try:
        reader = PdfReader(io.BytesIO(pdf_bytes))
        for idx, page in enumerate(reader.pages[:50]):
            text = page.extract_text() or ""
            clean_text = re.sub(r'[ \t]+', ' ', text).strip()
            if clean_text:
                pages_data.append({
                    "page": idx + 1,
                    "text": clean_text
                })
    except Exception as e:
        print(f"Error parsing PDF bytes: {e}")
    return pages_data


def detect_insurer_and_plan(pages: List[Dict[str, Any]], filename: Optional[str] = None) -> Dict[str, Any]:
    """Robust multi-signal detection of insurer and policy plan name."""
    if not pages:
        return {
            "company_name": "General Insurance Document",
            "plan_name": "Policy Wording",
            "company_website": "https://irdai.gov.in/",
            "irdai_claim_settlement_ratio": "95.0%",
            "incurred_claims_ratio": "64.0%",
            "base_rating": 7.5,
            "is_known_partner": False
        }

    page1_text = pages[0]["text"] if len(pages) > 0 else ""
    page2_text = pages[1]["text"] if len(pages) > 1 else ""
    first_pages_lower = (page1_text + " " + page2_text).lower()
    full_text_lower = " ".join([p["text"].lower() for p in pages])
    fn_lower = (filename or "").lower().replace("_", " ").replace("-", " ")

    best_insurer = None
    max_score = 0

    for ins in INSURER_REGISTRY:
        score = 0
        for kw in ins["keywords"]:
            if kw in fn_lower:
                score += 30
            header_count = first_pages_lower.count(kw)
            if header_count > 0:
                score += min(50, header_count * 15)
            doc_count = full_text_lower.count(kw)
            if doc_count > 0:
                score += min(20, doc_count * 2)

        if score > max_score:
            max_score = score
            best_insurer = ins

    # Check for plan name on Page 1
    extracted_plan_title = None
    p1_lines = [line.strip() for line in page1_text.split("\n") if len(line.strip()) > 5][:12]
    for line in p1_lines:
        line_clean = re.sub(r'^[#*\-•\d\.\s]+', '', line).strip()
        lower_l = line_clean.lower()
        if any(marker in lower_l for marker in ["policy wording", "policy schedule", "product name", "insurance policy", "health insurance", "term plan", "mediclaim"]):
            if len(line_clean) < 80 and not any(skip in lower_l for skip in ["company limited", "registered office", "cin:", "irdai reg"]):
                extracted_plan_title = line_clean
                break

    if best_insurer and max_score >= 15:
        final_plan = extracted_plan_title or best_insurer["plan_name"]
        return {
            "company_name": best_insurer["company_name"],
            "plan_name": final_plan,
            "company_website": best_insurer["company_website"],
            "irdai_claim_settlement_ratio": best_insurer["irdai_claim_settlement_ratio"],
            "incurred_claims_ratio": best_insurer["incurred_claims_ratio"],
            "base_rating": best_insurer["base_rating"],
            "is_known_partner": True
        }

    detected_company = "General Insurance Policy"
    for line in p1_lines[:5]:
        lower_l = line.lower()
        if any(w in lower_l for w in ["insurance", "assurance", "corporation", "ltd", "limited"]):
            detected_company = line[:70].strip()
            break

    url_match = re.search(r'(https?://[a-zA-Z0-9\-\.]+\.[a-zA-Z]{2,4}|www\.[a-zA-Z0-9\-\.]+\.[a-zA-Z]{2,4})', page1_text + " " + page2_text)
    company_url = url_match.group(0) if url_match else "https://irdai.gov.in/"
    if not company_url.startswith("http"):
        company_url = f"https://{company_url}"

    return {
        "company_name": detected_company,
        "plan_name": extracted_plan_title or "Uploaded Insurance Policy Wording",
        "company_website": company_url,
        "irdai_claim_settlement_ratio": "95.0% (IRDAI Industry Benchmark)",
        "incurred_claims_ratio": "64.5%",
        "base_rating": 7.5,
        "is_known_partner": False
    }


def detect_policy_domain(pages: List[Dict[str, Any]], filename: Optional[str] = None) -> str:
    """Detects the dominant insurance domain from the document text."""
    if not pages:
        return "general"

    full_text = " ".join([p.get("text", "") for p in pages]).lower()
    fn_lower = (filename or "").lower().replace("_", " ").replace("-", " ")
    combined = f"{full_text} {fn_lower}"

    domain_scores = {
        "health": 0,
        "life": 0,
        "motor": 0,
        "travel": 0,
        "property": 0,
        "general": 0,
    }

    keyword_map = {
        "health": [
            "health insurance", "mediclaim", "hospitalization", "inpatient", "room rent",
            "pre-existing disease", "day care", "ayush", "claim settlement ratio"
        ],
        "life": [
            "term insurance", "life insurance", "sum assured", "death benefit", "terminal illness",
            "maturity benefit", "premium paying term", "suicide exclusion", "grace period"
        ],
        "motor": [
            "motor insurance", "car insurance", "bike insurance", "vehicle insurance",
            "own damage", "third party", "idv", "insured declared value", "accident cover"
        ],
        "travel": [
            "travel insurance", "trip", "journey", "trip cancellation", "baggage loss",
            "medical evacuation", "overseas", "emergency assistance"
        ],
        "property": [
            "fire insurance", "home insurance", "property insurance", "structure", "contents",
            "burglary", "earthquake", "storm", "flood", "householder"
        ],
    }

    for domain, keywords in keyword_map.items():
        for kw in keywords:
            if kw in combined:
                domain_scores[domain] += 10

    if combined.count("policy wording") or combined.count("policy schedule"):
        domain_scores["general"] += 2

    best_domain = max(domain_scores.items(), key=lambda item: item[1])[0]
    if domain_scores[best_domain] == 0:
        return "general"
    return best_domain


def find_high_precision_clause(
    pages: List[Dict[str, Any]],
    core_keywords: List[str],
    operative_signals: List[str],
    negative_signals: Optional[List[str]] = None
) -> Optional[Dict[str, Any]]:
    """
    High-precision sentence extractor:
    - Filters out Table of Contents lines.
    - Scores operative sentences over definitions.
    - Returns the exact page where the highest-scoring operative sentence was found.
    """
    candidates = []

    for page_obj in pages:
        page_num = page_obj["page"]
        text = page_obj["text"]

        # Split text into lines and clean sentences
        lines = [l.strip() for l in text.split("\n") if l.strip()]
        for line in lines:
            # Skip TOC lines
            if is_toc_line(line):
                continue

            # Split line into sentences if multi-sentence
            sentences = re.split(r'(?<=[.!?])\s+(?=[A-Z0-9])', line)
            for s in sentences:
                s_clean = re.sub(r'\s+', ' ', s.strip())
                if len(s_clean) < 20:
                    continue

                s_lower = s_clean.lower()

                # Must contain at least one core keyword
                matched_core = [kw for kw in core_keywords if kw in s_lower]
                if not matched_core:
                    continue

                # Score calculation
                score = 15.0

                # Check operative signals (numbers, limits, sublimits)
                for op in operative_signals:
                    if op in s_lower:
                        score += 15.0

                # Check numbers, percentages, or rupee references
                if re.search(r'\d+[%|\s*months|\s*days|\s*years|\s*lakh]', s_lower):
                    score += 10.0

                # Penalize definitions
                if is_definition_sentence(s_lower):
                    score -= 25.0

                # Penalize negative signals
                if negative_signals:
                    for neg in negative_signals:
                        if neg in s_lower:
                            score -= 20.0

                if score >= 20.0:
                    # Clean up quote length
                    display_quote = s_clean
                    if len(display_quote) > 260:
                        display_quote = display_quote[:255] + "..."

                    candidates.append({
                        "page": page_num,
                        "sentence": display_quote,
                        "score": score
                    })

    if not candidates:
        return None

    # Pick candidate with highest score
    candidates.sort(key=lambda x: x["score"], reverse=True)
    return candidates[0]


def extract_relevant_generic_clauses(pages: List[Dict[str, Any]], domain: str) -> Dict[str, Any]:
    """Extracts the most important clauses for non-health insurance products in a generic, accurate way."""
    clauses = []
    score_modifier = 0.0

    if domain == "life":
        clause_specs = [
            (
                "Sum Assured / Death Benefit",
                ["sum assured", "death benefit", "fatal accident", "life assured", "nominee"],
                ["100%", "sum assured", "nominee", "monthly policy"],
                ["definition"],
                "Life cover pays the agreed amount to the nominee on death or terminal illness as specified by the policy."
            ),
            (
                "Suicide Exclusion & Waiting Period",
                ["suicide", "waiting period", "first 12 months", "initial waiting"],
                ["12 months", "suicide", "waiting period", "benefit payable"],
                [],
                "This is a critical clause because claims arising from suicide within the early policy period are subject to restricted benefits."
            ),
            (
                "Grace Period & Lapse",
                ["grace period", "premium due", "lapse", "renewal"],
                ["30 days", "grace period", "premium due", "policy lapse"],
                [],
                "The policy may continue for a short period after a missed premium, but coverage can lapse quickly if the premium is not paid in time."
            ),
            (
                "Free Look / Cooling-Off",
                ["free look", "cooling off", "refund", "online purchase"],
                ["30 days", "free look", "refund", "fully refunded"],
                [],
                "The policy gives a limited review period during which the buyer may cancel and get a refund, subject to policy terms."
            ),
            (
                "Permanent Exclusions",
                ["exclusions", "not covered", "hazardous occupation", "intentionally self-inflicted"],
                ["not covered", "excluded", "hazardous", "self-inflicted", "war"],
                ["definition"],
                "Certain deaths and events are excluded; this affects the real value of the cover and must be reviewed carefully."
            ),
        ]
    elif domain == "motor":
        clause_specs = [
            (
                "Insured Declared Value (IDV)",
                ["insured declared value", "idv", "vehicle value", "market value"],
                ["idv", "market value", "replacement", "sum insured"],
                [],
                "IDV is the maximum compensation value in a total loss case and directly affects your premium and claim payout."
            ),
            (
                "Deductible / Excess",
                ["deductible", "excess", "voluntary deductible"],
                ["deductible", "excess", "not covered", "own damage"],
                [],
                "A deductible means you pay part of the claim amount out of pocket before the insurer settles the balance."
            ),
            (
                "Third-Party vs Own Damage",
                ["third party", "own damage", "liability"],
                ["third party", "liability", "own damage"],
                [],
                "This distinction determines whether the policy covers the damage to your own vehicle or only damages caused to others."
            ),
            (
                "Depreciation & Wear & Tear",
                ["depreciation", "wear and tear", "ageing"],
                ["depreciation", "wear and tear", "parts"],
                [],
                "The insurer may reduce claim value for aging or worn components; zero-depreciation add-ons can change this materially."
            ),
            (
                "Exclusions & Limits",
                ["exclusions", "not covered", "driving without licence", "drunk driving", "commercial use"],
                ["not covered", "exclusion", "racing", "drunk", "license"],
                [],
                "Any restriction on usage, driver age, or driving conditions can invalidate or reduce claims."
            ),
        ]
    elif domain == "travel":
        clause_specs = [
            (
                "Trip Duration & Validity",
                ["policy period", "trip duration", "destination", "travel dates"],
                ["duration", "trip", "validity", "policy period"],
                [],
                "Travel cover is only valid for the stated trip dates, route, and covered territory."
            ),
            (
                "Emergency Medical & Evacuation",
                ["emergency medical", "medical evacuation", "repatriation"],
                ["medical", "evacuation", "repatriation", "emergency"],
                [],
                "Emergency treatment, evacuation, and repatriation are often subject to strict limits and conditions."
            ),
            (
                "Baggage & Personal Belongings",
                ["baggage", "lost baggage", "delayed baggage"],
                ["baggage", "loss", "delay", "personal effects"],
                [],
                "Baggage claims usually have sub-limits and list of excluded items, so do not assume full replacement value."
            ),
            (
                "Pre-Existing Medical Conditions",
                ["pre-existing", "medical condition", "illness"],
                ["pre-existing", "chronic", "exclusion", "medical condition"],
                [],
                "Many travel policies exclude or limit claims arising from known medical conditions unless declared and accepted."
            ),
            (
                "Trip Cancellation & Claims Procedure",
                ["trip cancellation", "claims procedure", "documentation"],
                ["cancellation", "claim", "documents", "proof"],
                [],
                "Cancellation claims require prompt notice, proof, and often a strict list of accepted documentation."
            ),
        ]
    elif domain == "property":
        clause_specs = [
            (
                "Sum Insured / Reinstatement",
                ["sum insured", "reinstatement", "replacement value", "contents"],
                ["sum insured", "reinstatement", "replacement", "contents"],
                [],
                "The insured value is the maximum claim limit and must be aligned with the actual rebuild or replacement value."
            ),
            (
                "Perils Covered",
                ["fire", "storm", "flood", "earthquake", "burglary"],
                ["fire", "storm", "flood", "earthquake", "burglary"],
                [],
                "Policy wording defines the covered perils; not every natural disaster or accidental loss is automatically covered."
            ),
            (
                "Deductibles & Excess",
                ["deductible", "excess", "surplus"],
                ["deductible", "excess", "deduction"],
                [],
                "A deductible lowers the insurer's payout and can be applied per claim or as a percentage of loss."
            ),
            (
                "Exclusions & Wear & Tear",
                ["wear and tear", "maintenance", "gradual deterioration", "exclusion"],
                ["wear and tear", "maintenance", "gradual", "exclusion"],
                [],
                "Gradual deterioration and maintenance-related issues are often excluded, so the policy should be understood exactly."
            ),
            (
                "Claims Procedure & Evidence",
                ["claims procedure", "evidence", "proof", "photos", "police report"],
                ["photos", "claim", "documents", "police", "evidence"],
                [],
                "Claims are usually supported by proof of damage, photographs, and official reports, and delays can affect admissibility."
            ),
        ]
    else:
        clause_specs = [
            (
                "Coverage Scope",
                ["cover", "sum insured", "benefit", "policy terms"],
                ["coverage", "sum insured", "benefit"],
                [],
                "The policy must be read carefully to confirm exactly what losses and events are covered under the contract."
            ),
            (
                "Exclusions",
                ["exclusions", "not covered", "excluded"],
                ["excluded", "not covered", "exclusions"],
                [],
                "Exclusions define the situations where the policy does not pay; these are often the most important things to understand."
            ),
            (
                "Claims Process",
                ["claim", "notice", "documentation", "proof"],
                ["claim", "notice", "document", "proof"],
                [],
                "The claims process and required evidence can materially impact whether the claim is approved on time."
            ),
        ]

    for title, core, signals, negatives, summary in clause_specs:
        match = find_high_precision_clause(pages, core, signals, negatives)
        if match:
            clauses.append({
                "category": title,
                "found": True,
                "page_number": match["page"],
                "exact_clause_title": f"{title} (Page {match['page']})",
                "highlighted_quote": match["sentence"],
                "severity": "warning" if "exclusion" in title.lower() or "waiting" in title.lower() or "deductible" in title.lower() else "favorable",
                "plain_english_takeaway": summary
            })
        else:
            clauses.append({
                "category": title,
                "found": False,
                "page_number": None,
                "exact_clause_title": f"{title} not clearly found",
                "highlighted_quote": None,
                "severity": "neutral",
                "plain_english_takeaway": f"No clear clause identified for {title.lower()}. Verify this item directly with the insurer before buying or claiming."
            })

    return {"clauses": clauses, "score_modifier": 1.0}


def extract_and_evaluate_all_12_clauses(pages: List[Dict[str, Any]], policy_domain: Optional[str] = None) -> Dict[str, Any]:
    """
    Evaluates all 12 vital IRDAI health and insurance categories:
    1. Room Rent & Boarding Sub-Limits (1% cap vs Single Private Room)
    2. Intensive Care Unit (ICU) Sub-Limits
    3. Pre-Existing Diseases (PED) Waiting Period (24 vs 36 vs 48 months)
    4. Specific Ailments / Named Illness Waiting Period (Cataract, Hernia, Joint Replacement)
    5. Initial 30-Day Waiting Period
    6. Mandatory Co-Payment / Cost Sharing (Senior Citizen vs Zone)
    7. Sum Insured Restoration / Refill / Recharge Benefit
    8. Cumulative Bonus / No-Claim Bonus (NCB)
    9. Pre & Post Hospitalization Medical Window
    10. Day Care Procedures & Modern Advanced Surgeries
    11. AYUSH In-Patient Alternative Treatment
    12. Permanent Exclusions & Non-Payable Consumables
    """
    if policy_domain and policy_domain != "health":
        return extract_relevant_generic_clauses(pages, policy_domain)

    clauses = []
    score_modifier = 0.0

    # -------------------------------------------------------------
    # 1. ROOM RENT & BOARDING SUB-LIMITS
    # -------------------------------------------------------------
    room = find_high_precision_clause(
        pages=pages,
        core_keywords=["room rent", "single private", "room category", "inpatient accommodation", "sub-limit on room", "room charges"],
        operative_signals=["1%", "2%", "single private", "proportionate deduction", "no sub-limit", "capped at", "actuals", "per day", "twin sharing"],
        negative_signals=["table of contents", "index"]
    )
    if room:
        s_lower = room["sentence"].lower()
        if "1%" in s_lower or "2%" in s_lower or "capped" in s_lower or "limited to" in s_lower:
            sev = "warning"
            score_modifier -= 2.0
            takeaway = (
                f"Caution (Found on Page {room['page']}): Daily room rent is capped! If your room costs more than the specified limit, "
                f"a punitive PROPORTIONATE DEDUCTION applies across all surgeon fees, nursing, and doctor visits."
            )
        else:
            sev = "favorable"
            score_modifier += 1.5
            takeaway = (
                f"Favorable (Found on Page {room['page']}): Up to Single Private A/C Room covered without daily capping or proportionate deduction penalties!"
            )
        clauses.append({
            "category": "Room Rent & Accommodation Sub-Limits",
            "found": True,
            "page_number": room["page"],
            "exact_clause_title": f"Room Category Terms (Page {room['page']})",
            "highlighted_quote": room["sentence"],
            "severity": sev,
            "plain_english_takeaway": takeaway
        })
    else:
        clauses.append({
            "category": "Room Rent & Accommodation Sub-Limits",
            "found": False,
            "page_number": None,
            "exact_clause_title": "Not Explicitly Found in Scanned Pages",
            "highlighted_quote": None,
            "severity": "neutral",
            "plain_english_takeaway": "Room rent terms were not explicitly detected in scanned pages. Ensure you verify room rent eligibility before hospital admission."
        })

    # -------------------------------------------------------------
    # 2. INTENSIVE CARE UNIT (ICU) CHARGES
    # -------------------------------------------------------------
    icu = find_high_precision_clause(
        pages=pages,
        core_keywords=["intensive care unit", "icu charges", "iccu", "critical care"],
        operative_signals=["no sub-limit", "at actuals", "2%", "capped at", "sub-limit", "per day"],
        negative_signals=[]
    )
    if icu:
        s_lower = icu["sentence"].lower()
        if "2%" in s_lower or "capped" in s_lower or "limited" in s_lower:
            sev = "warning"
            score_modifier -= 1.0
            takeaway = f"Warning (Page {icu['page']}): ICU expenses are capped! Daily ICU limit applies."
        else:
            sev = "favorable"
            score_modifier += 0.5
            takeaway = f"Favorable (Page {icu['page']}): Intensive Care Unit (ICU) expenses covered at actuals without restrictive sub-limits."
        clauses.append({
            "category": "ICU (Intensive Care Unit) Limits",
            "found": True,
            "page_number": icu["page"],
            "exact_clause_title": f"ICU Coverage Clause (Page {icu['page']})",
            "highlighted_quote": icu["sentence"],
            "severity": sev,
            "plain_english_takeaway": takeaway
        })
    else:
        clauses.append({
            "category": "ICU (Intensive Care Unit) Limits",
            "found": False,
            "page_number": None,
            "exact_clause_title": "Not Specified in Scanned Pages",
            "highlighted_quote": None,
            "severity": "neutral",
            "plain_english_takeaway": "ICU charges not separately detailed in scanned pages; typically covered under general inpatient hospitalization."
        })

    # -------------------------------------------------------------
    # 3. PRE-EXISTING DISEASES (PED) WAITING PERIOD
    # -------------------------------------------------------------
    ped = find_high_precision_clause(
        pages=pages,
        core_keywords=["pre-existing", "ped", "waiting period"],
        operative_signals=["24 months", "36 months", "48 months", "12 months", "2 years", "3 years", "4 years", "moratorium"],
        negative_signals=["definition", "table of contents"]
    )
    if ped:
        s_lower = ped["sentence"].lower()
        if "24 months" in s_lower or "2 years" in s_lower or "12 months" in s_lower or "1 year" in s_lower:
            sev = "favorable"
            score_modifier += 1.5
            takeaway = f"Favorable (Page {ped['page']}): Short 24-month (or 12-month) waiting period for pre-existing illnesses like Diabetes or Hypertension."
        elif "36 months" in s_lower or "3 years" in s_lower or "48 months" in s_lower or "4 years" in s_lower:
            sev = "warning"
            score_modifier -= 1.0
            takeaway = f"Caution (Page {ped['page']}): Long waiting period (36 to 48 months). Pre-existing conditions are not covered for the first 3 to 4 years!"
        else:
            sev = "favorable"
            takeaway = f"Standard waiting period applies (Found on Page {ped['page']}). Keep all renewal receipts to port your waiting period credit."
        clauses.append({
            "category": "Pre-Existing Diseases (PED) Waiting Period",
            "found": True,
            "page_number": ped["page"],
            "exact_clause_title": f"PED Waiting Period Clause (Page {ped['page']})",
            "highlighted_quote": ped["sentence"],
            "severity": sev,
            "plain_english_takeaway": takeaway
        })
    else:
        clauses.append({
            "category": "Pre-Existing Diseases (PED) Waiting Period",
            "found": False,
            "page_number": None,
            "exact_clause_title": "Not Specified in Scanned Pages",
            "highlighted_quote": None,
            "severity": "neutral",
            "plain_english_takeaway": "PED waiting period not found in scanned pages. Standard IRDAI rules mandate 24 to 36 months."
        })

    # -------------------------------------------------------------
    # 4. SPECIFIC AILMENTS / SLOW-GROWING ILLNESSES (2-Year List)
    # -------------------------------------------------------------
    spec = find_high_precision_clause(
        pages=pages,
        core_keywords=["cataract", "hernia", "joint replacement", "specific illnesses", "specified ailments", "hysterectomy", "calculus"],
        operative_signals=["24 months", "12 months", "2 years", "1 year", "waiting period", "sub-limit"],
        negative_signals=[]
    )
    if spec:
        clauses.append({
            "category": "Specific Ailments Waiting Period (Cataract, Hernia, Joint Replacement)",
            "found": True,
            "page_number": spec["page"],
            "exact_clause_title": f"Specified Diseases Clause (Page {spec['page']})",
            "highlighted_quote": spec["sentence"],
            "severity": "warning",
            "plain_english_takeaway": (
                f"Important (Page {spec['page']}): Slow-growing conditions (Cataract, Hernia, Knee Replacement, Kidney Stones) "
                f"require a mandatory 12 to 24-month waiting period before claims are payable."
            )
        })
    else:
        clauses.append({
            "category": "Specific Ailments Waiting Period (Cataract, Hernia, Joint Replacement)",
            "found": False,
            "page_number": None,
            "exact_clause_title": "Not Specified in Scanned Pages",
            "highlighted_quote": None,
            "severity": "neutral",
            "plain_english_takeaway": "Specific disease schedule not detected in scanned pages; almost all Indian insurers enforce a 24-month waiting period for Cataract and Hernia."
        })

    # -------------------------------------------------------------
    # 5. INITIAL 30-DAY WAITING PERIOD
    # -------------------------------------------------------------
    init_wait = find_high_precision_clause(
        pages=pages,
        core_keywords=["initial waiting", "30 days", "thirty days", "first 30 days"],
        operative_signals=["except accident", "accidental", "inception", "illness", "waiting period"],
        negative_signals=[]
    )
    if init_wait:
        clauses.append({
            "category": "Initial 30-Day Waiting Period",
            "found": True,
            "page_number": init_wait["page"],
            "exact_clause_title": f"Initial Waiting Period (Page {init_wait['page']})",
            "highlighted_quote": init_wait["sentence"],
            "severity": "favorable",
            "plain_english_takeaway": (
                f"Standard Statutory Rule (Page {init_wait['page']}): No hospital claim for illness is payable in the first 30 days of a fresh policy. "
                f"Emergency hospitalization due to accidents is covered from Day 1."
            )
        })
    else:
        clauses.append({
            "category": "Initial 30-Day Waiting Period",
            "found": False,
            "page_number": None,
            "exact_clause_title": "Not Explicitly Found in Scanned Pages",
            "highlighted_quote": None,
            "severity": "neutral",
            "plain_english_takeaway": "Standard statutory 30-day initial moratorium applies under IRDAI guidelines (accidents covered immediately)."
        })

    # -------------------------------------------------------------
    # 6. MANDATORY CO-PAYMENT OBLIGATION
    # -------------------------------------------------------------
    copay = find_high_precision_clause(
        pages=pages,
        core_keywords=["co-payment", "copay", "co-pay", "cost sharing", "nil copay", "nil co-payment"],
        operative_signals=["10%", "20%", "nil", "zero", "61 years", "zone", "deductible"],
        negative_signals=[]
    )
    if copay:
        s_lower = copay["sentence"].lower()
        if "nil" in s_lower or "zero" in s_lower or "no copay" in s_lower or "0%" in s_lower:
            sev = "favorable"
            score_modifier += 1.5
            takeaway = f"Favorable (Page {copay['page']}): Zero mandatory co-payment! The insurance company settles 100% of approved hospital expenses."
        else:
            sev = "warning"
            score_modifier -= 1.5
            takeaway = f"Warning (Page {copay['page']}): Co-payment clause detected! You must pay 10% to 20% of every medical bill out of your personal pocket."
        clauses.append({
            "category": "Co-Payment Obligation",
            "found": True,
            "page_number": copay["page"],
            "exact_clause_title": f"Cost Sharing / Co-Pay Clause (Page {copay['page']})",
            "highlighted_quote": copay["sentence"],
            "severity": sev,
            "plain_english_takeaway": takeaway
        })
    else:
        score_modifier += 1.0
        clauses.append({
            "category": "Co-Payment Obligation",
            "found": False,
            "page_number": None,
            "exact_clause_title": "No Mandatory Co-Payment Detected",
            "highlighted_quote": None,
            "severity": "favorable",
            "plain_english_takeaway": "No mandatory co-payment detected in scanned pages. Insurer pays 100% of admissible hospital claims."
        })

    # -------------------------------------------------------------
    # 7. SUM INSURED RESTORATION / RECHARGE BENEFIT
    # -------------------------------------------------------------
    rest = find_high_precision_clause(
        pages=pages,
        core_keywords=["restoration", "recharge", "rebound", "reinstatement", "refill"],
        operative_signals=["100%", "basic sum", "automatic", "exhaustion", "unrelated", "related", "once per year"],
        negative_signals=[]
    )
    if rest:
        score_modifier += 1.5
        clauses.append({
            "category": "Sum Insured Restoration / Refill",
            "found": True,
            "page_number": rest["page"],
            "exact_clause_title": f"Restoration Benefit (Page {rest['page']})",
            "highlighted_quote": rest["sentence"],
            "severity": "favorable",
            "plain_english_takeaway": (
                f"Excellent Feature (Page {rest['page']}): If a severe hospitalization exhausts your sum insured, "
                f"the insurer automatically refills coverage for subsequent hospitalizations in the same policy year!"
            )
        })
    else:
        clauses.append({
            "category": "Sum Insured Restoration / Refill",
            "found": False,
            "page_number": None,
            "exact_clause_title": "Not Specified in Scanned Pages",
            "highlighted_quote": None,
            "severity": "neutral",
            "plain_english_takeaway": "Automatic restoration not highlighted in scanned pages. Consider purchasing a Super Top-Up policy for large bill security."
        })

    # -------------------------------------------------------------
    # 8. CUMULATIVE BONUS / NO-CLAIM BONUS (NCB)
    # -------------------------------------------------------------
    ncb = find_high_precision_clause(
        pages=pages,
        core_keywords=["cumulative bonus", "no claim bonus", "ncb", "bonus super"],
        operative_signals=["50%", "10%", "claim-free", "claim free", "sum insured", "maximum of 100%", "500%"],
        negative_signals=[]
    )
    if ncb:
        score_modifier += 1.0
        clauses.append({
            "category": "Cumulative Bonus (No-Claim Bonus / NCB)",
            "found": True,
            "page_number": ncb["page"],
            "exact_clause_title": f"Cumulative Bonus Clause (Page {ncb['page']})",
            "highlighted_quote": ncb["sentence"],
            "severity": "favorable",
            "plain_english_takeaway": (
                f"High Reward (Page {ncb['page']}): For every claim-free year, your sum insured automatically increases "
                f"without any increase in premium!"
            )
        })
    else:
        clauses.append({
            "category": "Cumulative Bonus (No-Claim Bonus / NCB)",
            "found": False,
            "page_number": None,
            "exact_clause_title": "Not Specified in Scanned Pages",
            "highlighted_quote": None,
            "severity": "neutral",
            "plain_english_takeaway": "No-claim bonus rules not detailed in scanned pages. Typically ranges from 10% to 50% per claim-free renewal."
        })

    # -------------------------------------------------------------
    # 9. PRE & POST HOSPITALIZATION WINDOW
    # -------------------------------------------------------------
    prepost = find_high_precision_clause(
        pages=pages,
        core_keywords=["pre-hospitalization", "post-hospitalization", "prior to admission", "following discharge"],
        operative_signals=["60 days", "180 days", "30 days", "90 days", "reimbursement"],
        negative_signals=[]
    )
    if prepost:
        score_modifier += 1.0
        clauses.append({
            "category": "Pre & Post Hospitalization Days",
            "found": True,
            "page_number": prepost["page"],
            "exact_clause_title": f"Pre/Post Hospitalization Timeline (Page {prepost['page']})",
            "highlighted_quote": prepost["sentence"],
            "severity": "favorable",
            "plain_english_takeaway": (
                f"Keep Your Bills (Page {prepost['page']}): Save all doctor consultation receipts, diagnostic blood tests, and pharmacy slips. "
                f"You can claim reimbursement for expenses incurred 30-60 days before hospital admission and 60-180 days post-discharge."
            )
        })
    else:
        clauses.append({
            "category": "Pre & Post Hospitalization Days",
            "found": False,
            "page_number": None,
            "exact_clause_title": "Not Explicitly Found in Scanned Pages",
            "highlighted_quote": None,
            "severity": "neutral",
            "plain_english_takeaway": "Pre/Post timelines not found in scanned pages. Standard IRDAI industry default is 30 days pre / 60 days post."
        })

    # -------------------------------------------------------------
    # 10. DAY CARE PROCEDURES & MODERN TREATMENTS
    # -------------------------------------------------------------
    daycare = find_high_precision_clause(
        pages=pages,
        core_keywords=["day care", "daycare", "modern treatment", "robotic surgery", "stem cell"],
        operative_signals=["less than 24 hours", "day care procedures", "technological advancement", "sub-limit"],
        negative_signals=[]
    )
    if daycare:
        score_modifier += 0.5
        clauses.append({
            "category": "Day Care Procedures & Modern Advanced Surgeries",
            "found": True,
            "page_number": daycare["page"],
            "exact_clause_title": f"Day Care & Modern Surgeries (Page {daycare['page']})",
            "highlighted_quote": daycare["sentence"],
            "severity": "favorable",
            "plain_english_takeaway": (
                f"Covered (Page {daycare['page']}): Daycare surgeries (like Dialysis, Chemotherapy, Eye procedures) "
                f"do NOT require 24 hours of hospital bed admission to get paid!"
            )
        })
    else:
        clauses.append({
            "category": "Day Care Procedures & Modern Advanced Surgeries",
            "found": False,
            "page_number": None,
            "exact_clause_title": "Not Specified in Scanned Pages",
            "highlighted_quote": None,
            "severity": "neutral",
            "plain_english_takeaway": "Daycare list not detailed in scanned pages; most modern Indian policies cover 400+ listed daycare surgeries."
        })

    # -------------------------------------------------------------
    # 11. AYUSH IN-PATIENT TREATMENT
    # -------------------------------------------------------------
    ayush = find_high_precision_clause(
        pages=pages,
        core_keywords=["ayush", "ayurveda", "unani", "siddha", "homeopathy"],
        operative_signals=["government hospital", "nabh", "inpatient", "up to sum insured", "sub-limit"],
        negative_signals=[]
    )
    if ayush:
        score_modifier += 0.5
        clauses.append({
            "category": "AYUSH In-Patient Alternative Treatment",
            "found": True,
            "page_number": ayush["page"],
            "exact_clause_title": f"AYUSH In-Patient Clause (Page {ayush['page']})",
            "highlighted_quote": ayush["sentence"],
            "severity": "favorable",
            "plain_english_takeaway": (
                f"Alternative Medicine (Page {ayush['page']}): Inpatient Ayurvedic, Homeopathic, or Unani treatments "
                f"are covered when taken in accredited government or NABH hospitals."
            )
        })
    else:
        clauses.append({
            "category": "AYUSH In-Patient Alternative Treatment",
            "found": False,
            "page_number": None,
            "exact_clause_title": "Not Specified in Scanned Pages",
            "highlighted_quote": None,
            "severity": "neutral",
            "plain_english_takeaway": "AYUSH coverage not found in scanned pages. Verify with insurer if you plan to seek Ayurvedic or Homeopathic hospital care."
        })

    # -------------------------------------------------------------
    # 12. PERMANENT EXCLUSIONS & NON-PAYABLE CONSUMABLES
    # -------------------------------------------------------------
    excl = find_high_precision_clause(
        pages=pages,
        core_keywords=["permanent exclusions", "exclusions", "not covered", "not payable", "excluded treatments"],
        operative_signals=["cosmetic", "investigation", "consumables", "unproven", "self-inflicted", "hazardous"],
        negative_signals=["definition"]
    )
    if excl:
        clauses.append({
            "category": "Key Permanent Exclusions & Non-Payable Items",
            "found": True,
            "page_number": excl["page"],
            "exact_clause_title": f"Policy Exclusions Section (Page {excl['page']})",
            "highlighted_quote": excl["sentence"],
            "severity": "warning",
            "plain_english_takeaway": (
                f"Hospital Bill Deductions (Page {excl['page']}): Non-medical items (gloves, PPE kits, oxygen masks, food charges) "
                f"are permanently excluded from insurance claims unless you attach a 'Consumables Rider'."
            )
        })
    else:
        clauses.append({
            "category": "Key Permanent Exclusions & Non-Payable Items",
            "found": False,
            "page_number": None,
            "exact_clause_title": "Standard Statutory Exclusions Apply",
            "highlighted_quote": None,
            "severity": "warning",
            "plain_english_takeaway": "Standard non-payable exclusions apply across Indian healthcare: cosmetic surgery, self-harm, and non-medical hospital consumables."
        })

    return {
        "clauses": clauses,
        "score_modifier": score_modifier
    }


def analyze_policy_content(
    file_bytes: Optional[bytes] = None,
    filename: Optional[str] = None,
    preset_code: Optional[str] = None,
    raw_text: Optional[str] = None
) -> Dict[str, Any]:
    """
    Main student-engineered pipeline:
    1. Extracts real text from uploaded PDF or raw input.
    2. Identifies insurer and verified purchase URL with weighted scoring.
    3. Runs high-precision 12-category clause mining with exact page citations.
    4. Computes consumer health score and honest buy recommendation.
    """
    pages: List[Dict[str, Any]] = []
    source_label = "Sample Policy"

    # 1. Real PDF Upload
    if file_bytes is not None and len(file_bytes) > 0:
        source_label = filename or "Uploaded PDF Document"
        pages = extract_pages_from_pdf_bytes(file_bytes)
        total_extracted_chars = sum(len(p.get("text", "")) for p in pages)

        if not pages or total_extracted_chars < 40:
            raise ValueError(
                "The uploaded PDF has no extractable digital text (it appears to be a scanned image or photo). "
                "Please upload an official digital policy PDF with selectable text, or copy and paste the policy wording into the 'Paste Text' tab."
            )

    # 2. Raw Text Paste Mode
    elif raw_text and len(raw_text.strip()) > 30:
        source_label = "Pasted Policy Text"
        pages = [{"page": 1, "text": raw_text.strip()}]

    # 3. Preset Mode
    elif preset_code:
        chosen_code = preset_code if preset_code in SAMPLE_POLICY_DOCS else "hdfc"
        preset_text = SAMPLE_POLICY_DOCS[chosen_code]
        source_label = f"Sample Preset ({chosen_code.upper()})"
        pages = [{"page": 1, "text": preset_text}]
    else:
        raise ValueError("Please provide an insurance policy PDF file, paste policy clauses, or select a sample preset.")

    full_text = "\n".join([p["text"] for p in pages])
    word_count = len(full_text.split())

    # Detect Insurer & Website dynamically
    insurer_profile = detect_insurer_and_plan(pages, filename=filename)
    policy_domain = detect_policy_domain(pages, filename=filename)

    # Extract Real Clauses & Evaluate across all relevant categories
    evaluation = extract_and_evaluate_all_12_clauses(pages, policy_domain=policy_domain)
    clauses = evaluation["clauses"]

    # Calculate Final Score
    base_score = insurer_profile.get("base_rating", 7.5)
    final_score = round(max(3.0, min(9.8, base_score + (evaluation["score_modifier"] * 0.3))), 1)

    # Determine honest verdict
    if final_score >= 8.0:
        is_good_to_buy = True
        verdict_badge = "RECOMMENDED: CONSUMER FRIENDLY"
        verdict_summary = (
            f"This policy ({insurer_profile['plan_name']}) has consumer-friendly terms. "
            f"It avoids punitive room rent caps and offers high claim settlement certainty."
        )
    elif final_score >= 6.5:
        is_good_to_buy = True
        verdict_badge = "SATISFACTORY: PROCEED WITH CONDITIONS"
        verdict_summary = (
            f"Decent policy terms, but watch out for specific waiting periods or sub-limits highlighted in the clauses below. "
            f"Ensure you choose network hospitals to minimize out-of-pocket deductions."
        )
    else:
        is_good_to_buy = False
        verdict_badge = "HIGH RISK OF DEDUCTIONS: NOT RECOMMENDED"
        verdict_summary = (
            f"Warning: This policy document contains restrictive room rent sub-limits or mandatory co-payments. "
            f"You may face significant proportionate deductions during claim settlement."
        )

    # Pros and Gotchas summary
    pros = [
        f"Official IRDAI Claim Settlement Ratio (CSR): {insurer_profile['irdai_claim_settlement_ratio']}",
        "Emergency hospital pre-admission and post-discharge expense reimbursement",
        "Direct cashless settlement available across accredited network hospitals"
    ]
    if any(c["category"].startswith("Room Rent") and c.get("severity") == "favorable" for c in clauses):
        pros.insert(0, "No restrictive 1% room rent cap — Single Private AC room permitted without proportionate penalty")
    if any(c["category"].startswith("Co-Payment") and c.get("severity") == "favorable" for c in clauses):
        pros.append("Nil Co-Payment: Insurer settles 100% of approved hospital bills")
    if any(c["category"].startswith("Restoration") and c.get("found") for c in clauses):
        pros.append("Automatic Sum Insured Restoration: Refills cover upon exhaustion")

    gotchas = [
        "Initial 30-day waiting period applies to all non-accidental illnesses",
        "Hospital consumables (gloves, sanitizers, surgical kits) are excluded unless a consumables rider is purchased",
        "Pre-existing ailments (Diabetes, BP) subject to mandatory waiting period before claims are payable"
    ]
    if any(c["category"].startswith("Room Rent") and c.get("severity") == "warning" for c in clauses):
        gotchas.insert(0, "Alert: Room rent ceiling detected. Any room upgrade will trigger severe proportionate deductions across doctor and surgery fees!")
    if any(c["category"].startswith("Co-Payment") and c.get("severity") == "warning" for c in clauses):
        gotchas.append("Mandatory Co-payment detected: You must pay 10% to 20% of every claim out of your personal funds!")

    found_clauses_count = sum(1 for c in clauses if c.get("found"))
    critical_highlights = [
        item["plain_english_takeaway"]
        for item in clauses
        if item.get("plain_english_takeaway") and item.get("found")
    ]
    if not critical_highlights:
        critical_highlights = [
            "We found the policy text but could not extract a strong operative clause. Read the actual wording before buying or claiming."
        ]

    return {
        "status": "success",
        "source_file": source_label,
        "company_name": insurer_profile["company_name"],
        "plan_name": insurer_profile["plan_name"],
        "company_website": insurer_profile["company_website"],
        "irdai_claim_settlement_ratio": insurer_profile["irdai_claim_settlement_ratio"],
        "incurred_claims_ratio": insurer_profile["incurred_claims_ratio"],
        "policy_domain": policy_domain,
        "policy_health_score": final_score,
        "is_good_to_buy": is_good_to_buy,
        "verdict_badge": verdict_badge,
        "verdict_summary": verdict_summary,
        "critical_highlights": critical_highlights[:8],
        "clauses_to_remember": clauses,
        "pros": pros,
        "gotchas_and_fine_print": gotchas,
        "pages_scanned": len(pages),
        "word_count": word_count,
        "found_clauses_count": found_clauses_count,
        "total_categories_audited": len(clauses),
        "engine_details": "Multi-domain Insurance Policy Clause Scanner for health, life, motor, travel, and property products"
    }
