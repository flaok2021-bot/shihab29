// يضيف دعم النافذة العائمة (Picture-in-Picture) لمشروع الأندرويد المولّد بـ `npx cap add android`
const fs = require('fs');
const path = require('path');

const javaRoot = path.join('android', 'app', 'src', 'main', 'java');
const manifestPath = path.join('android', 'app', 'src', 'main', 'AndroidManifest.xml');

function findFile(dir, name) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) { const r = findFile(full, name); if (r) return r; }
    else if (e.name === name) return full;
  }
  return null;
}

const mainPath = findFile(javaRoot, 'MainActivity.java');
if (!mainPath) throw new Error('MainActivity.java not found');
const pkg = fs.readFileSync(mainPath, 'utf8').match(/^\s*package\s+([\w.]+);/m)[1];
const dir = path.dirname(mainPath);

fs.writeFileSync(path.join(dir, 'PipPlugin.java'), `package ${pkg};

import android.app.PictureInPictureParams;
import android.os.Build;
import android.util.Rational;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "Pip")
public class PipPlugin extends Plugin {
    @PluginMethod
    public void enter(final PluginCall call) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
            call.reject("PiP not supported");
            return;
        }
        getActivity().runOnUiThread(() -> {
            try {
                PictureInPictureParams params = new PictureInPictureParams.Builder()
                    .setAspectRatio(new Rational(9, 16))
                    .build();
                if (getActivity().enterPictureInPictureMode(params)) call.resolve();
                else call.reject("PiP refused");
            } catch (Exception e) {
                call.reject(e.getMessage());
            }
        });
    }
}
`);

fs.writeFileSync(mainPath, `package ${pkg};

import android.content.res.Configuration;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(PipPlugin.class);
        super.onCreate(savedInstanceState);
    }

    @Override
    public void onPictureInPictureModeChanged(boolean isInPip, Configuration newConfig) {
        super.onPictureInPictureModeChanged(isInPip, newConfig);
        if (getBridge() != null && getBridge().getWebView() != null) {
            getBridge().getWebView().evaluateJavascript(
                "document.body.classList.toggle('pip'," + isInPip + ");", null);
        }
    }
}
`);

let m = fs.readFileSync(manifestPath, 'utf8');
if (!m.includes('supportsPictureInPicture')) {
  m = m.replace('<activity', '<activity android:supportsPictureInPicture="true"');
  fs.writeFileSync(manifestPath, m);
}
console.log('PiP support added, package:', pkg);
