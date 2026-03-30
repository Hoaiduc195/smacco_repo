from app.schemas.parse_request import ExtractedFilters


class NLPService:
    """
    NLP Service for parsing user natural language queries.

    Extracts structured filters (location, type, budget) from free-text input.
    In production, this would use a trained NLP model or LLM API.
    """

    # Simple keyword mappings for MVP
    LOCATION_KEYWORDS = {
        "đà nẵng": "Đà Nẵng",
        "hồ chí minh": "TP.HCM",
        "hcm": "TP.HCM",
        "hà nội": "Hà Nội",
        "củ chi": "Củ Chi",
        "huế": "Huế",
        "nha trang": "Nha Trang",
        "đà lạt": "Đà Lạt",
    }

    TYPE_KEYWORDS = {
        "ăn": "food",
        "quán ăn": "food",
        "nhà hàng": "food",
        "cafe": "food",
        "cà phê": "food",
        "khách sạn": "accommodation",
        "homestay": "accommodation",
        "chỗ ở": "accommodation",
        "phòng": "accommodation",
    }

    BUDGET_KEYWORDS = {
        "rẻ": "cheap",
        "bình dân": "cheap",
        "trung bình": "medium",
        "vừa": "medium",
        "sang": "expensive",
        "cao cấp": "expensive",
    }

    def extract_filters(self, text: str) -> ExtractedFilters:
        """Extract location, type, and budget from natural language text."""
        text_lower = text.lower()

        location = None
        for keyword, value in self.LOCATION_KEYWORDS.items():
            if keyword in text_lower:
                location = value
                break

        place_type = None
        for keyword, value in self.TYPE_KEYWORDS.items():
            if keyword in text_lower:
                place_type = value
                break

        budget = None
        for keyword, value in self.BUDGET_KEYWORDS.items():
            if keyword in text_lower:
                budget = value
                break

        return ExtractedFilters(
            location=location,
            type=place_type,
            budget=budget,
        )
