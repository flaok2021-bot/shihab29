const fs = require('fs');
const path = 'android/app/src/main/AndroidManifest.xml';
let xml = fs.readFileSync(path, 'utf8');

xml = xml.replace('</manifest>', `    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
    <uses-permission android:name="android.permission.RECORD_AUDIO" />
</manifest>`);

const navIntents = `
            <intent-filter>
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.BROWSABLE" />
                <data android:scheme="geo" />
            </intent-filter>
            <intent-filter>
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <data android:scheme="google.navigation" />
            </intent-filter>
        </activity>`;

const mainActivityIdx = xml.indexOf('.MainActivity');
const closeIdx = xml.indexOf('</activity>', mainActivityIdx);
xml = xml.slice(0, closeIdx) + navIntents + xml.slice(closeIdx + '</activity>'.length);

fs.writeFileSync(path, xml);
console.log('AndroidManifest patched.');
