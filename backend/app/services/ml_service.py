from typing import Any, Dict, List


def _recyclable_ideas(waste_type: str) -> List[str]:
    ideas_by_type = {
        "plastic": [
            "Wash and repurpose as a planter.",
            "Collect for local plastic recycling drives.",
            "Reuse sturdy containers for storage.",
        ],
        "paper": [
            "Use for craft projects or note sheets.",
            "Bundle and send to paper recycling.",
            "Compost non-glossy, non-coated paper.",
        ],
        "glass": [
            "Reuse jars for kitchen storage.",
            "Drop at a neighborhood glass collection point.",
            "Upcycle bottles as decor pieces.",
        ],
        "metal": [
            "Collect cans for scrap recycling centers.",
            "Reuse tins as organizers.",
            "Separate and clean before recycling.",
        ],
    }
    return ideas_by_type.get(
        waste_type,
        [
            "Sort the item carefully before disposal.",
            "Check local recycling guidelines.",
        ],
    )


def _default_map_location() -> Dict[str, Any]:
    # Mock location; can be replaced later with geospatial lookup.
    return {
        "name": "Eco Drop Point - Central",
        "address": "MG Road, Bengaluru",
        "lat": 12.9716,
        "lng": 77.5946,
    }


def _disposal_instructions(waste_type: str) -> str:
    instructions = {
        "e-waste": "Do not mix with household garbage. Drop at an authorized e-waste center.",
        "medical": "Seal safely in marked bags and hand over to biomedical waste collection.",
        "organic": "Compost at home or use municipal wet-waste bins.",
        "hazardous": "Use designated hazardous waste collection points only.",
    }
    return instructions.get(
        waste_type,
        "Place in the designated non-recyclable (dry waste) municipal bin.",
    )


def predict_waste(file_name: str) -> Dict[str, Any]:
    lower_name = file_name.lower()

    if "plastic" in lower_name:
        waste_type = "plastic"
        recyclable = True
    elif "paper" in lower_name:
        waste_type = "paper"
        recyclable = True
    elif "glass" in lower_name:
        waste_type = "glass"
        recyclable = True
    elif "metal" in lower_name or "can" in lower_name:
        waste_type = "metal"
        recyclable = True
    elif "battery" in lower_name or "circuit" in lower_name or "phone" in lower_name:
        waste_type = "e-waste"
        recyclable = False
    else:
        waste_type = "organic"
        recyclable = False

    response: Dict[str, Any] = {
        "waste_type": waste_type,
        "recyclable": recyclable,
    }

    if recyclable:
        response["ideas"] = _recyclable_ideas(waste_type)
        response["map_location"] = _default_map_location()
    else:
        response["disposal_instructions"] = _disposal_instructions(waste_type)

    return response
