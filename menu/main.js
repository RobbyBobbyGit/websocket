document.getElementById("hostButton").addEventListener("click", () => {
  window.location.href = "https://robbybobbygit.github.io/websocket/Version_Main/web/";
});

document.getElementById("joinButton").addEventListener("click", () => {
  const joinCode = document.getElementById("joinCode").value.trim();
  if (joinCode) {
    window.location.href = `https://robbybobbygit.github.io/websocket/Version_Main/web/?join=${encodeURIComponent(joinCode)}`;
  } else {
    alert("Please enter a join code first!");
  }
});
