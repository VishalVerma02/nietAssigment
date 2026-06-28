Set fso = CreateObject("Scripting.FileSystemObject")
scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)

Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = scriptDir

' Start Backend server silently on port 5000 and log output
WshShell.Run "cmd.exe /c cd backend && node server.js > ..\backend_log.txt 2>&1", 0, False
WScript.Sleep 2000

' Start Frontend server silently on port 3001 and log output
WshShell.Run "cmd.exe /c cd frontend && node server.js > ..\frontend_log.txt 2>&1", 0, False
