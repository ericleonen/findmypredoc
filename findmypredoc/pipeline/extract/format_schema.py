def format_schema(schema):
        areas = {}

        for area in schema:
            fields = {}

            for field in schema[area]:
                details = schema[area][field]

                fields[field] = {
                    "type": "object",
                    "properties": {
                        "value": {
                            "type": details["type"] if not details["nullable"] else [details["type"], "null"],
                            "description": details["description"]
                        },
                        "why": {
                            "type": "string",
                            "description": f"A brief explanation, in your own words (not a verbatim quote), of why '{area}.{field}' has this value. If the field is null, explain why"
                        }
                    },
                    "additionalProperties": False,
                    "required": ["value", "why"]
                }

            areas[area] = {
                "type": "object",
                "properties": fields,
                "additionalProperties": False,
                "required": list(fields.keys())
            }

        formatted_schema = {
            "type": "object",
            "properties": areas,
            "additionalProperties": False,
            "required": list(areas.keys())
        }

        return formatted_schema