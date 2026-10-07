package org.iamthesource.hiddenfaces.tv;

import android.app.Activity;
import android.graphics.Bitmap;
import android.os.Bundle;
import android.view.KeyEvent;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

public class MainActivity extends Activity {
  private static final String REMOTE_URL = "https://codingwithjonny.github.io/hidden-faces-app/tv/";
  private static final String FALLBACK_URL = "file:///android_asset/tv/fallback.html";
  private WebView webView;
  private boolean mainFrameLoaded = false;

  @Override protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    requestWindowFeature(Window.FEATURE_NO_TITLE);
    getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
    immersive();

    webView = new WebView(this);
    webView.setFocusable(true);
    webView.setFocusableInTouchMode(true);

    WebSettings s = webView.getSettings();
    s.setJavaScriptEnabled(true);
    s.setDomStorageEnabled(true);
    s.setMediaPlaybackRequiresUserGesture(false);
    s.setAllowFileAccess(true);
    s.setAllowContentAccess(true);
    s.setCacheMode(WebSettings.LOAD_DEFAULT);

    webView.setWebChromeClient(new WebChromeClient());
    webView.setWebViewClient(new WebViewClient() {
      @Override public void onPageStarted(WebView view, String url, Bitmap favicon) {
        if (url != null && url.startsWith("https://codingwithjonny.github.io/")) mainFrameLoaded = false;
      }

      @Override public void onPageFinished(WebView view, String url) {
        if (url != null && url.startsWith("https://codingwithjonny.github.io/")) mainFrameLoaded = true;
      }

      @Override public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
        if (request != null && request.isForMainFrame() && !mainFrameLoaded) {
          view.loadUrl(FALLBACK_URL);
        }
      }
    });

    setContentView(webView);
    webView.loadUrl(REMOTE_URL);
    webView.requestFocus();
  }

  private void immersive() {
    getWindow().getDecorView().setSystemUiVisibility(
      View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY |
      View.SYSTEM_UI_FLAG_FULLSCREEN |
      View.SYSTEM_UI_FLAG_HIDE_NAVIGATION |
      View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN |
      View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION |
      View.SYSTEM_UI_FLAG_LAYOUT_STABLE
    );
  }

  @Override public boolean onKeyDown(int keyCode, KeyEvent event) {
    if (keyCode == KeyEvent.KEYCODE_BACK && webView != null) {
      String url = webView.getUrl();
      if (url != null && url.startsWith("file:")) {
        webView.loadUrl(REMOTE_URL + "?menu=1");
      } else {
        webView.evaluateJavascript("window.TV&&window.TV.androidBack?window.TV.androidBack():null;", null);
      }
      return true;
    }
    return super.onKeyDown(keyCode, event);
  }

  @Override protected void onResume() {
    super.onResume();
    immersive();
    if (webView != null) webView.onResume();
  }

  @Override protected void onPause() {
    if (webView != null) webView.onPause();
    super.onPause();
  }
}
