document.getElementById("analyzeBtn").addEventListener("click", async () => {
  const input = document.getElementById("inputText").value.trim();
  if (!input) return alert("Please enter some text.");

  // Temporary mock output until Chrome AI APIs are integrated
  document.getElementById("sentiment").textContent = "🧠 Sentiment: Neutral";
  document.getElementById("clarity").textContent = "✨ Clarity: Clear and well-structured.";
  document.getElementById("risk").textContent = "⚠️ Reputation Risk: Low";
});
