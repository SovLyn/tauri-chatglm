use log::{warn, info};
use tauri::Manager;
use window_vibrancy::*;

mod news;

#[tauri::command]
async fn greet(model_token: String, news_token: String) -> Result<String, String> {
    info!("greet: model_token: {model_token}, news_token: {news_token}");
    let res= news::get_news(model_token, news_token).await;
    match res {
        Ok(r) => Ok(r),
        Err(e) => {
            warn!("Error: {}", e);
            Err(e.to_string())
        },
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            let window = app.get_webview_window("main").unwrap();
            #[cfg(target_os = "macos")]
            apply_vibrancy(&window, NSVisualEffectMaterial::HudWindow, None, None)
                .expect("Unsupported platform! 'apply_vibrancy' is only supported on macOS");

            #[cfg(target_os = "windows")]
            let _ = apply_acrylic(&window, Some((0, 0, 0, 0)))?;

            Ok(())
        })
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_log::Builder::new().level(log::LevelFilter::Info).build())
        .invoke_handler(tauri::generate_handler![greet])
        .run(tauri::generate_context![])
        .expect("error while running tauri application");
}
