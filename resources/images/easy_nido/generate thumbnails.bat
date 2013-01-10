em @echo off
del tt.bat
for %%a in (*.png) do echo call do1.bat %%a tn\%%a >>tt.bat
for %%a in (*.jpg) do echo call do1.bat %%a tn\%%a >>tt.bat

:exit
pause
call tt.bat
