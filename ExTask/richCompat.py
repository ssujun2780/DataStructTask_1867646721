import re


try:
    from rich.columns import Columns
    from rich.console import Console
    from rich.panel import Panel
    from rich.text import Text
except ImportError:
    class Text:
        def __init__(self):
            self._parts = []

        def append(self, value):
            self._parts.append(str(value))

        def __str__(self):
            return "".join(self._parts)

    class Panel:
        def __init__(self, renderable, title=None, subtitle=None, expand=False):
            self.renderable = renderable
            self.title = title
            self.subtitle = subtitle

        def __str__(self):
            lines = []
            if self.title:
                lines.append(_strip_markup(self.title))
            lines.append(str(self.renderable))
            if self.subtitle:
                lines.append(_strip_markup(self.subtitle))
            return "\n".join(lines)

    class Columns:
        def __init__(self, renderables, expand=False, equal=False):
            self.renderables = renderables

        def __str__(self):
            return "\n\n".join(str(renderable) for renderable in self.renderables)

    class Console:
        def __init__(self, record=False, width=None):
            self.record = record
            self._buffer = []

        def print(self, *values, **kwargs):
            output = " ".join(_strip_markup(str(value)) for value in values)
            if self.record:
                self._buffer.append(output)
            else:
                print(output)

        def export_text(self):
            return "\n".join(self._buffer)


def _strip_markup(value):
    return re.sub(r"\[/?[a-zA-Z][^\]]*\]", "", value)
