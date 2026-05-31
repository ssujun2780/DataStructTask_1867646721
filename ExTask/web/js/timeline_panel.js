export function createTimelinePanel(container) {
  function render(logs) {
    const recent = (logs || []).slice(-8).reverse();
    if (!recent.length) {
      container.innerHTML = `<div class="timeline-log"><strong>Idle</strong><div class="muted">No logs yet.</div></div>`;
      return;
    }

    container.innerHTML = recent.map((log) => `
      <div class="timeline-log">
        <strong>${log.phase}</strong>
        <div>${log.result?.message || ""}</div>
        <div class="muted">${(log.result?.warnings || []).join(" / ")}</div>
      </div>
    `).join("");
  }

  return { render };
}
