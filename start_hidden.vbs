Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = "C:\Users\vence\.gemini\antigravity\scratch\space-bunny-harness"
WshShell.Run "node bin/sbh.js web", 0, False

