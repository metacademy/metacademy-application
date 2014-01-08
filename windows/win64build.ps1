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
$url1 = "http://sourceforge.net/projects/numpy/files/wheels_to_test/numpy-1.9.0.dev_3aa76ba-cp27-none-macosx_10_6_intel.whl/download"
$path1 = "$projectDir\lib\site-packages\numpy-1.9.0.dev_3aa76ba-cp27-none-macosx_10_6_intel.whl"
$url2 =  "https://pypi.python.org/packages/cp27/P/Pillow/Pillow-2.3.0-cp27-none-win_amd64.whl#md5=65b3935d6a752b4c659154f21f2d9048"
$path2 = "$projectDir\lib\site-packages\Pillow-2.3.0-cp27-none-win32.whl"
(new-object System.Net.WebClient).DownloadFile( $url1, $path1)
(new-object System.Net.WebClient).DownloadFile( $url2, $path2)
cd "$projectDir\lib\site-packages"
pip install --use-wheel numpy-1.9.0.dev_3aa76ba-cp27-none-macosx_10_6_intel.whl
pip install --use-wheel Pillow-2.3.0-cp27-none-win_amd64.whl
cd "$baseDir\windows"
#If you're behind a proxy, it re-write look like this instead: pip install -r requirements.txt --proxy http://proxyaddress:proxyport
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
