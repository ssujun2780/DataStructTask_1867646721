export function createContextMenu(container) {
  function open(x, y, node, items) {
    container.innerHTML = items.map((item, index) => `
      <button data-index="${index}" ${item.disabled ? "disabled" : ""}>${item.label}</button>
    `).join("");
    container.style.left = `${x}px`;
    container.style.top = `${y}px`;
    container.classList.remove("hidden");
    container.querySelectorAll("button[data-index]").forEach((button) => {
      button.addEventListener("click", () => {
        const item = items[Number(button.dataset.index)];
        if (item.disabled) return;
        close();
        item.action?.(node);
      });
    });
  }

  function close() {
    container.classList.add("hidden");
  }

  return { open, close };
}
