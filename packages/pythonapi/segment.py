import re

# segment given text
def segment_text(text_in):
    """
    Segment the text into segments based on the naive dependency parser.
    
    Args:
        text_in (text): the text to be segmented
 
    Returns:
        dict: JSON response with the segmented text and segments
    """
    
    # Clean the text from <> tags
    cleaned_text = clean_text(text_in)

    # Apply the naive dependency parser
    segs = dependency_parser(cleaned_text)

    # Rebuild text_out with segment identifiers
    text_out = cleaned_text
    for seg in segs:
        seg_id = seg['id']
        seg_text = seg['text']
        text_out = text_out.replace(seg_text, f"[{seg_id}]{seg_text}[/{seg_id}]")

    # Re-insert the <> tags into text_out
    tags = re.findall(r'<[^>]+>.*?</[^>]+>', text_in)
    for tag in tags:
        inner_text = re.sub(r'<[^>]+>(.*?)</[^>]+>', r'\1', tag)
        text_out = text_out.replace(inner_text, tag)

    # Return the JSON response
    return {
        'text_out': text_out,
        'segments': segs
    }

def clean_text(text):
    """
    Clean text from <xyz> tags.

    Args:
        text (text): the text to be cleaned
 
    Returns:
        text: cleaned text
    """
    return re.sub(r'<[^>]+>(.*?)</[^>]+>', r'\1', text)

def dependency_parser(text):
    """
    Simple dependency parser mock function.
 
    Args:
        text (text): the text
 
    Returns:
        dict: list of segments
    """

    words = text.split()
    segments = []
    seg_id = 1
    
    # Simulate segmentation based on punctuation as a placeholder
    seg_text = []
    for word in words:
        seg_text.append(word)
        if word.endswith('.'):
            segments.append({
                "id": f"S{seg_id}",
                "text": ' '.join(seg_text)
            })
            seg_id += 1
            seg_text = []

    if seg_text:
        segments.append({
            "id": f"S{seg_id}",
            "text": ' '.join(seg_text)
        })

    return segments