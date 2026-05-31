class TextManager:
    """Loads and renders localisation JSON resources.

    Text files live under localisation/<language>/.
    The first key passed to render decides the resource file:
      text("common", "continue") -> localisation/ko/gameText.json
      text("eventText", "studentEvent", "eureka", "title")
        -> localisation/ko/eventText/studentEvent.json

    Placeholders use Python str.format syntax, e.g. {player_name}.
    Missing keys or missing template variables intentionally raise errors so
    localisation mistakes are visible during development.
    """

    def __init__(self, loader, language="ko", default_file="gameText.json"):
        self._loader = loader
        self._language = language
        self._default_file = default_file

    def _load_resource(self, *keys):
        if not keys:
            raise KeyError("TextManager requires at least one key")

        if keys[0] == "eventText":
            if len(keys) < 3:
                raise KeyError("eventText requires event file and text key")
            event_file = keys[1]
            filename = event_file if event_file.endswith(".json") else f"{event_file}.json"
            return self._loader(self._language, "eventText", filename), keys[2:]

        return self._loader(self._language, self._default_file), keys

    def get(self, *keys):
        value, remaining_keys = self._load_resource(*keys)
        for key in remaining_keys:
            value = value[key]
        return value

    def render(self, *keys, **variables):
        template = self.get(*keys)
        if variables:
            return template.format(**variables)
        return template
