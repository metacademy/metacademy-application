$script:scriptDir = $myinvocation.mycommand.path
$script:baseDir = split-path (resolve-path "$scriptDir/..") -Parent
$script:projectDir = split-path (resolve-path "$baseDir") -Parent
cd "$projectDir"
git clone https://github.com/metacademy/metacademy-content.git
mkdir "$projectDir\local_dbs\django_db"
mkdir "$projectDir\local_dbs\content_index"
mkdir "$projectDir\local_dbs\app_index"
virtualenv .
#Replacing django-incompatible PoSh activate script
If (test-path "$projectDir\scripts\activate.ps1") {Remove-Item "$projectDir\scripts\activate.ps1"}
cp "$baseDir\windows\activate.ps1" "$projectDir\scripts\activate.ps1"
cd "$projectDir\scripts"
.\activate.ps1
#Workaround to make a compiler optional instead of a dependency
$url1 = "https://pypi.python.org/packages/2.7/n/numpy/numpy-1.7.1.win32-py2.7.exe#md5=dc11133ce1ce90ceb8f715e879a96e5f"
$path1 = "$projectDir\lib\site-packages\numpy-1.7.1.win32-py2.7.exe"
$url2 =  "https://pypi.python.org/packages/cp27/P/Pillow/Pillow-2.3.0-cp27-none-win32.whl#md5=7e3f9c37920df5c4566d068fcc4e83f3"
$path2 = "$projectDir\lib\site-packages\Pillow-2.3.0-cp27-none-win32.whl"
(new-object System.Net.WebClient).DownloadFile( $url1, $path1)
(new-object System.Net.WebClient).DownloadFile( $url2, $path2)
cd "$projectDir\lib\site-packages"
easy_install numpy-1.7.1.win32-py2.7.exe
pip install --use-wheel Pillow-2.3.0-cp27-none-win32.whl
(Get-Content "$baseDir\requirements.txt") -notmatch "numpy|pillow" | Set-Content "$projectDir\lib\site-packages\requirements.txt"
pip install -r requirements.txt
cd "$baseDir"
git clone https://github.com/cjrd/kmap.git app_server/static/lib/kmap
#Workaround to make kmap work without symlinks
Remove-Item "$baseDir\app_server\static\javascript\lib\kmapjs"
Remove-Item "$baseDir\app_server\static\css\lib\kmapcss"
cp "$baseDir\app_server\static\lib\kmap\js" "$baseDir\app_server\static\javascript\lib\kmapjs" -recurse
cp "$baseDir\app_server\static\lib\kmap\css" "$baseDir\app_server\static\css\lib\kmapcss" -recurse
cd "$baseDir"
cp config-template.py config.py
cp app_server/settings_local-template.py app_server/settings_local.py
python app_server/manage.py syncdb --noinput
python app_server/manage.py migrate
cd app_server/static/javascript
node lib/r.js -o build.js
cd "$baseDir"
python app_server/manage.py collectstatic --noinput
Write-Host "Setup Complete!" -foregroundcolor cyan -backgroundcolor darkgray
