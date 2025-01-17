use log::{info, warn};
use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    webview::WebviewWindowBuilder,
    Manager,
};
use window_vibrancy::*;
mod news;

#[tauri::command]
async fn get_news(news_token: String) -> Result<String, String> {
    info!("get_news: news_token: {news_token}");
    let res = news::get_news(news_token).await;
    match res {
        Ok(r) => Ok(r),
        Err(e) => {
            warn!("Error: {}", e);
            Err(e.to_string())
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            let quit_i = MenuItem::with_id(app, "quit", "退出", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&quit_i])?;
            let _tray =
                TrayIconBuilder::new()
                    .icon(app.default_window_icon().unwrap().clone())
                    .on_tray_icon_event(|tray, event| match event {
                        TrayIconEvent::Click {
                            button: MouseButton::Left,
                            button_state: MouseButtonState::Up,
                            ..
                        } => {
                            info!("left click pressed and released");
                            let app = tray.app_handle();
                            if let Some(window) = app.get_webview_window("main") {
                                let _ = window.show();
                                let _ = window.set_focus();
                            } else {
                                let window = WebviewWindowBuilder::new(
                                    app,
                                    "main",
                                    tauri::WebviewUrl::App("index.html".into()),
                                )
                                .title("chatglm")
                                .transparent(true)
                                .resizable(true)
                                .inner_size(960.0,600.0)
                                .min_inner_size(768.0, 0.0)
                                .decorations(false)                                // Any additional window configuration here
                                .build()
                                .expect("Failed to create window.");
                                // Show the window
                                window.show().expect("Failed to show window.");
                                window.set_focus().expect("Failed to set focus.");

                                #[cfg(target_os = "macos")]
                                apply_vibrancy(&window, NSVisualEffectMaterial::HudWindow, None, None)
                                    .expect("Unsupported platform! 'apply_vibrancy' is only supported on macOS");

                                #[cfg(target_os = "windows")]
                                let _ = apply_acrylic(&window, Some((0, 0, 0, 0)))
                                    .expect("Unsupported platform! 'apply_acrylic' is only supported on Windows");
                            }
                        }
                        unknown => {
                            info!("unhandled event {unknown:?}");
                        }
                    })
                    .menu(&menu)
                    .on_menu_event(|app, event| match event.id.as_ref() {
                        "quit" => {
                            info!("quit menu item clicked");
                            app.exit(0);
                        }
                        _ => {}
                    })
                    .build(app)?;

            let window = app.get_webview_window("main").unwrap();
            #[cfg(target_os = "macos")]
            apply_vibrancy(&window, NSVisualEffectMaterial::HudWindow, None, None)
                .expect("Unsupported platform! 'apply_vibrancy' is only supported on macOS");

            #[cfg(target_os = "windows")]
            let _ = apply_acrylic(&window, Some((0, 0, 0, 0)))
                .expect("Unsupported platform! 'apply_acrylic' is only supported on Windows");

            Ok(())
        })
        .plugin(tauri_plugin_shell::init())
        .plugin(
            tauri_plugin_log::Builder::new()
                .level(log::LevelFilter::Info)
                .build(),
        )
        .invoke_handler(tauri::generate_handler![get_news])
        .build(tauri::generate_context!())
        .expect("error while running tauri application")
        .run(move |app_handle, event| match event {
            tauri::RunEvent::ExitRequested { api, .. } => {
                api.prevent_exit();
                if let Some(window) = app_handle.get_webview_window("main") {
                    let _ = window.minimize();
                }
            }
            _ => {}
        });
}
