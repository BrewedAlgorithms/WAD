# microservices_python/utils/gemini_client.py

import google.generativeai as genai
import json
from config.settings import settings
from config.logging import get_logger
from typing import Dict, Any, List

logger = get_logger(__name__)

# --- Configure the Gemini API client ---
try:
    genai.configure(api_key=settings.GEMINI_API_KEY)
    logger.info("Google Gemini API client configured successfully.")
except Exception as e:
    logger.error(f"Failed to configure Gemini API client: {e}", exc_info=True)
    # This will cause subsequent calls to fail if the key is missing.

def get_gemini_model():
    """Initializes and returns the Gemini Pro model instance."""
    try:
        return genai.GenerativeModel(settings.GEMINI_MODEL)
    except Exception as e:
        logger.error(f"Error initializing Gemini model '{settings.GEMINI_MODEL}': {e}")
        return None

def generate_json_from_text(text_content: str, prompt_instructions: str, json_schema: Dict[str, Any]) -> Dict[str, Any]:
    """
    A robust function to generate a JSON object from text using Gemini.

    Args:
        text_content (str): The source text from a document.
        prompt_instructions (str): The specific instructions for the AI model.
        json_schema (Dict[str, Any]): A dictionary representing the desired JSON structure.

    Returns:
        A dictionary parsed from Gemini's JSON response.
    """
    model = get_gemini_model()
    if not model:
        raise ConnectionError("Gemini model not initialized. Check API key and configuration.")

    # Construct the prompt for JSON mode
    prompt = f"""
    {prompt_instructions}

    Analyze the following text content and extract the information based on the instructions.
    Provide the output *only* in a valid JSON format that adheres to this schema:

    SCHEMA:
    {json.dumps(json_schema, indent=2)}

    TEXT CONTENT:
    ---
    {text_content[:settings.GEMINI_MAX_TOKENS]}
    ---
    """

    # Try multiple strategies to get a valid response
    strategies = [
        # Strategy 1: Regular text mode with JSON instructions
        lambda: _try_generate_with_text_mode(model, prompt, json_schema),
        # Strategy 2: JSON mode without safety restrictions
        lambda: _try_generate_with_json_mode(model, prompt, safety_settings="none"),
        # Strategy 3: JSON mode with safety settings
        lambda: _try_generate_with_json_mode(model, prompt, safety_settings="low"),
        # Strategy 4: Simplified prompt with basic JSON
        lambda: _try_generate_simplified(model, text_content, prompt_instructions, json_schema)
    ]

    for i, strategy in enumerate(strategies, 1):
        try:
            logger.info(f"Trying strategy {i} for Gemini API call.")
            result = strategy()
            logger.info(f"Successfully generated response using strategy {i}.")
            return result
        except Exception as e:
            logger.warning(f"Strategy {i} failed: {e}")
            if i == len(strategies):
                logger.error("All strategies failed for Gemini API call.")
                raise RuntimeError("Failed to get a valid response from Gemini API after trying all strategies.") from e

def _try_generate_with_json_mode(model, prompt: str, safety_settings: str = "low") -> Dict[str, Any]:
    """Try generating with JSON mode and specified safety settings."""
    safety_config = {
        "low": [
            {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE"},
            {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE"},
            {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_NONE"},
            {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_NONE"},
        ],
        "none": [
            {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE"},
            {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE"},
            {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_NONE"},
            {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_NONE"},
        ]
    }
    
    response = model.generate_content(
        prompt,
        generation_config=genai.types.GenerationConfig(
            temperature=settings.GEMINI_TEMPERATURE,
            response_mime_type="application/json",
        ),
        safety_settings=safety_config[safety_settings]
    )
    
    # Check if response was blocked
    if hasattr(response, 'candidates') and response.candidates:
        candidate = response.candidates[0]
        if hasattr(candidate, 'finish_reason') and candidate.finish_reason == 1:
            raise ValueError("Response blocked by safety filters")
    
    if not response.text:
        raise ValueError("Empty response from Gemini API")
    
    return json.loads(response.text)

def _try_generate_with_text_mode(model, prompt: str, json_schema: Dict[str, Any]) -> Dict[str, Any]:
    """Try generating with regular text mode and parse JSON from response."""
    response = model.generate_content(
        prompt,
        generation_config=genai.types.GenerationConfig(
            temperature=settings.GEMINI_TEMPERATURE,
        ),
        safety_settings=[
            {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE"},
            {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE"},
            {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_NONE"},
            {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_NONE"},
        ]
    )
    
    if not response.text:
        raise ValueError("Empty response from Gemini API")
    
    # Try to extract JSON from the response
    text = response.text.strip()
    
    # Look for JSON in the response
    start_idx = text.find('{')
    end_idx = text.rfind('}')
    
    if start_idx != -1 and end_idx != -1:
        json_str = text[start_idx:end_idx + 1]
        try:
            return json.loads(json_str)
        except json.JSONDecodeError:
            pass
    
    # If no valid JSON found, create a basic structure
    return _create_fallback_response(json_schema)

def _try_generate_simplified(model, text_content: str, instructions: str, json_schema: Dict[str, Any]) -> Dict[str, Any]:
    """Try with a simplified prompt that's less likely to trigger safety filters."""
    simplified_prompt = f"""
    {instructions}
    
    Extract basic information from this text and return as JSON:
    {text_content[:5000]}
    
    Return only valid JSON.
    """
    
    response = model.generate_content(
        simplified_prompt,
        generation_config=genai.types.GenerationConfig(
            temperature=settings.GEMINI_TEMPERATURE,
        ),
        safety_settings=[
            {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE"},
            {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE"},
            {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_NONE"},
            {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_NONE"},
        ]
    )
    
    if not response.text:
        raise ValueError("Empty response from Gemini API")
    
    # Try to parse JSON from response
    text = response.text.strip()
    start_idx = text.find('{')
    end_idx = text.rfind('}')
    
    if start_idx != -1 and end_idx != -1:
        json_str = text[start_idx:end_idx + 1]
        try:
            return json.loads(json_str)
        except json.JSONDecodeError:
            pass
    
    return _create_fallback_response(json_schema)

def _create_fallback_response(json_schema: Dict[str, Any]) -> Dict[str, Any]:
    """Create a basic fallback response when all strategies fail."""
    fallback = {}
    
    def create_fallback_value(schema_value):
        if isinstance(schema_value, dict):
            return {}
        elif isinstance(schema_value, list):
            return []
        elif "string" in str(schema_value):
            return ""
        elif "null" in str(schema_value):
            return None
        else:
            return ""
    
    def process_schema(schema, target_dict):
        for key, value in schema.items():
            if isinstance(value, dict):
                target_dict[key] = {}
                process_schema(value, target_dict[key])
            elif isinstance(value, list):
                target_dict[key] = []
            else:
                target_dict[key] = create_fallback_value(value)
    
    process_schema(json_schema, fallback)
    return fallback


# --- Specific Task Functions ---

def get_metadata_from_text(text: str, need_summary: bool = False) -> Dict[str, Any]:
    """
    Uses Gemini to extract structured metadata and optionally a summary from text.

    Args:
        text (str): The text content of the research paper.
        need_summary (bool): If True, a detailed summary will be included in the output.

    Returns:
        A dictionary containing the extracted metadata.
    """
    instructions = """You are an expert academic researcher and research analyst with deep expertise in analyzing scientific papers across all disciplines. Your task is to thoroughly analyze the provided research paper text and extract comprehensive metadata with high accuracy and detail.

ANALYSIS REQUIREMENTS:
1. **Title Extraction**: Identify the exact paper title, ensuring it captures the main research focus
2. **Author Information**: Extract all author names and their institutional affiliations with precision
3. **Abstract Analysis**: Provide the complete abstract if available, or synthesize one from the paper content
4. **Keyword Identification**: Generate 5-10 relevant keywords that accurately represent the paper's scope and methodology
5. **Journal Information**: Extract journal name, volume, issue, and publication details
6. **Publication Date**: Identify the publication date in YYYY-MM-DD format when possible
7. **DOI**: Extract the Digital Object Identifier if present

RESEARCH ANALYSIS COMPONENTS:
- **Research Area**: Identify the primary and secondary research domains (e.g., "Machine Learning in Computer Vision")
- **Methodology**: Describe the research approach, methods used, and experimental design
- **Key Findings**: Extract 3-7 major discoveries, results, or contributions
- **Limitations**: Identify 2-4 significant limitations or constraints of the research
- **Research Impact**: Assess the potential impact on the field, applications, and future research directions

QUALITY STANDARDS:
- Ensure all extracted information is factually accurate and directly from the source text
- Maintain academic rigor and precision in terminology
- Provide comprehensive coverage of all available metadata
- Use clear, concise language suitable for academic databases"""
    
    schema = {
        "title": "string",
        "authors": [{"name": "string", "affiliation": "string or null"}],
        "abstract": "string",
        "keywords": ["string"],
        "journal": {"name": "string or null", "volume": "string or null", "issue": "string or null"},
        "publication_date": "string (YYYY-MM-DD format if possible)",
        "doi": "string or null",
        "gemini_analysis": {
            "research_area": "string",
            "methodology": "string",
            "key_findings": ["string"],
            "limitations": ["string"],
            "research_impact": "string"
        }
    }
    
    # Enhanced detailed summary instructions
    if need_summary:
        instructions += """

DETAILED SUMMARY REQUIREMENTS:
Create a comprehensive, well-structured detailed summary that provides a thorough overview of the research paper. The summary should be:

STRUCTURE:
1. **Research Context**: Begin with the broader research context and problem statement
2. **Objectives**: Clearly state the research objectives and questions addressed
3. **Methodology Overview**: Summarize the research approach, methods, and experimental design
4. **Key Results**: Present the main findings and results with specific details
5. **Significance**: Explain the implications and significance of the findings
6. **Contributions**: Highlight the paper's main contributions to the field

CONTENT REQUIREMENTS:
- Length: 300-500 words for comprehensive coverage
- Tone: Academic and objective, suitable for researchers and professionals
- Detail Level: Include specific findings, methodologies, and quantitative results when available
- Clarity: Use clear, precise language that conveys complex concepts effectively
- Completeness: Cover all major sections of the paper including introduction, methods, results, and conclusions
- Accuracy: Ensure all information is factually correct and directly from the source

QUALITY CRITERIA:
- Provide sufficient detail for researchers to understand the paper's scope and contributions
- Include relevant quantitative data, statistics, and experimental results
- Mention key methodologies, datasets, and experimental setups
- Highlight novel approaches, innovations, or significant findings
- Address both theoretical and practical implications
- Maintain logical flow from problem statement to conclusions

The detailed summary should serve as a comprehensive overview that allows readers to quickly understand the paper's scope, methodology, findings, and significance without reading the full paper."""
        schema["detailed_summary"] = "string"

    return generate_json_from_text(text, instructions, schema)

def get_summary_from_text(text: str, summary_type: str = "technical", max_length: int = 250) -> Dict[str, Any]:
    """
    Uses Gemini to generate a structured summary from text.

    Args:
        text (str): The text content to summarize.
        summary_type (str): The desired style of summary (e.g., 'technical', 'layman', 'brief').
        max_length (int): The approximate desired length of the summary in words.

    Returns:
        A dictionary containing the summary, key points, and citations.
    """
    instructions = f"""You are an expert academic summarizer and research analyst specializing in creating high-quality, structured summaries of scientific papers. Generate a comprehensive summary of the following research text.

SUMMARY TYPE: {summary_type.upper()}
TARGET LENGTH: {max_length} words

SUMMARY REQUIREMENTS:

**For Technical Summaries:**
- Use precise academic terminology and technical language
- Include specific methodologies, algorithms, and experimental details
- Focus on quantitative results, statistical significance, and technical contributions
- Maintain scientific rigor and accuracy

**For Layman Summaries:**
- Use accessible language while maintaining accuracy
- Explain technical concepts in simple terms
- Focus on practical implications and real-world applications
- Avoid jargon and complex terminology

**For Brief Summaries:**
- Provide concise, essential information only
- Focus on main findings and key contributions
- Use clear, direct language
- Emphasize the most important results

STRUCTURE REQUIREMENTS:
1. **Main Summary**: A comprehensive overview covering the research problem, methodology, key findings, and significance
2. **Key Points**: 5-8 bullet points highlighting the most important aspects:
   - Research objectives and questions
   - Key methodologies and approaches
   - Major findings and results
   - Significant contributions
   - Practical implications
   - Limitations and future directions
3. **Cited Works**: Identify and list the most relevant references and citations mentioned in the text

QUALITY STANDARDS:
- Ensure factual accuracy and direct representation of source material
- Maintain logical flow and coherent structure
- Provide sufficient detail for the intended audience
- Include quantitative data and specific results when available
- Highlight novel contributions and significant findings
- Address both theoretical and practical implications

The summary should serve as a comprehensive yet accessible overview that captures the essence and significance of the research."""
    
    schema = {
        "summary": "string",
        "key_points": ["string"],
        "cited_works": ["string"],
    }

    return generate_json_from_text(text, instructions, schema)

def get_detailed_summary_from_text(text: str) -> Dict[str, Any]:
    """
    Uses Gemini to generate a comprehensive, structured detailed summary from research text.
    This function is specifically designed for creating high-quality detailed summaries
    that provide thorough coverage of research papers.

    Args:
        text (str): The text content of the research paper.

    Returns:
        A dictionary containing the structured detailed summary with multiple components.
    """
    instructions = """You are an expert research analyst and academic writer specializing in creating comprehensive, well-structured detailed summaries of scientific papers. Your task is to generate a thorough, multi-component summary that provides complete coverage of the research paper.

DETAILED SUMMARY STRUCTURE:

**1. EXECUTIVE OVERVIEW (150-200 words)**
- Provide a high-level summary of the research problem, approach, and main findings
- Include the research context and significance
- Highlight the paper's primary contributions

**2. RESEARCH CONTEXT AND MOTIVATION (100-150 words)**
- Describe the broader research landscape and problem domain
- Explain why this research is important and timely
- Identify the specific gaps or challenges addressed

**3. OBJECTIVES AND RESEARCH QUESTIONS (50-100 words)**
- Clearly state the research objectives and specific questions addressed
- Outline the scope and limitations of the study
- Define the expected outcomes

**4. METHODOLOGY AND APPROACH (150-200 words)**
- Describe the research design and methodology in detail
- Explain the experimental setup, datasets, and procedures
- Include technical details, algorithms, and analytical methods
- Mention any novel approaches or innovations

**5. KEY FINDINGS AND RESULTS (200-250 words)**
- Present the main results with specific quantitative data
- Include statistical significance and performance metrics
- Highlight the most important discoveries and outcomes
- Compare results with existing work when relevant

**6. ANALYSIS AND DISCUSSION (150-200 words)**
- Interpret the results and their implications
- Discuss the significance of findings in the broader context
- Address potential limitations and caveats
- Explore theoretical and practical implications

**7. CONTRIBUTIONS AND IMPACT (100-150 words)**
- Summarize the paper's main contributions to the field
- Assess the potential impact on future research
- Identify practical applications and real-world relevance
- Suggest directions for future work

QUALITY REQUIREMENTS:
- **Accuracy**: Ensure all information is factually correct and directly from the source
- **Completeness**: Cover all major sections of the paper comprehensively
- **Clarity**: Use clear, precise language suitable for researchers and professionals
- **Depth**: Provide sufficient detail for understanding without reading the full paper
- **Structure**: Maintain logical flow and coherent organization
- **Objectivity**: Present information neutrally while highlighting significance
- **Technical Precision**: Use appropriate technical terminology and maintain scientific rigor

SPECIFIC GUIDELINES:
- Include relevant quantitative data, statistics, and experimental results
- Mention key methodologies, datasets, and experimental setups
- Highlight novel approaches, innovations, or significant findings
- Address both theoretical and practical implications
- Maintain academic tone while ensuring accessibility
- Provide context for technical concepts and methodologies
- Include comparisons with related work when relevant

The detailed summary should serve as a comprehensive overview that allows researchers to quickly understand the paper's scope, methodology, findings, and significance without reading the full paper."""
    
    schema = {
        "executive_overview": "string",
        "research_context": "string", 
        "objectives": "string",
        "methodology": "string",
        "key_findings": "string",
        "analysis": "string",
        "contributions": "string",
        "total_summary": "string"  # Combined comprehensive summary
    }

    return generate_json_from_text(text, instructions, schema)