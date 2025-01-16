use std::error::Error;
use log::warn;
use tokio;
use serde::{Deserialize, Serialize};
use scraper::{Html, Selector};

#[derive(Serialize, Deserialize, Debug)]
struct News {
    id: String,
    ctime: String,
    title: String,
    description: String,
    source: String,
    #[serde(rename = "picUrl")]
    pic_url: String,
    url: String,
}

#[derive(Serialize, Deserialize, Debug)]
struct ResResult {
    curpage: u32,
    allnum: u32,
    newslist: Vec<News>,
}

#[derive(Serialize, Deserialize, Debug)]
struct Response {
    code: u32,
    msg: String,
    result: ResResult,
}

#[derive(Serialize, Deserialize, Debug)]
struct NewsQuery{
    title: String,
    description: String,
    ctime: String,
    content: String,
}

#[derive(Serialize, Deserialize, Debug)]
struct Message {
    role: String,
    content: String,
}

#[derive(Serialize, Deserialize, Debug)]
struct ModelQuery{
    model: String,
    messages: Vec<Message>,
}

pub async fn get_news(model_token: String, news_token: String)-> Result<String, Box<dyn Error>> {
    let params= [("key", news_token), ("num", "20".to_owned())];
    let url = reqwest::Url::parse_with_params("https://apis.tianapi.com/it/index", &params)?;
    let res = reqwest::get(url).await?;
    if res.status() != 200 {
        warn!("Error: failed to get news, status code: {}", res.status());
        return Err("Error: failed to get news".into());
    }

    let res = serde_json::from_str::<Response>(&res.text().await?)?;
    if res.code != 200 {
        warn!("Error: failed to get news, code: {}", res.code);
        return Err("Error: failed to get news".into());
    }

    let tasks: Vec<_> = res.result.newslist.into_iter().map(|news| {
        let url =  news.url;
        tokio::spawn(async move {
            let client = match reqwest::Client::builder().user_agent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3").build(){
                Ok(client) => client,
                Err(err) => {
                    warn!("Error: failed to build client, err: {}", err);
                    return None;
                }
            };
            match client.get(url).send().await {
                Ok(res) => {
                    if res.status() == 200 {
                        Some(NewsQuery{
                            title: news.title,
                            content: res.text().await.unwrap_or("".to_string()),
                            description: news.description,
                            ctime: news.ctime,
                        })
                    }else {
                        warn!("Error: failed to get news, status code: {}", res.status());
                        None
                    }
                },
                Err(e) => {
                    warn!("Error: failed to get news, error: {}", e);
                    None
                }
            }
        })
    }).collect();

    let mut news_list = Vec::new();

    let results = futures::future::join_all(tasks).await;
    for result in results {
        if let Ok(Some(mut news)) = result {
            match parse_dom(&news.content) {
                Ok(content) => {
                    news.content = content;
                    news_list.push(news);
                },
                Err(e) => {
                    warn!("Error: failed to parse news, error: {}", e);
                }
            };
        }
    }

    if news_list.len() == 0 {
        return Err("No news found".into());
    }

    let client = reqwest::Client::new();
    let news_string = serde_json::to_string(&news_list)?;

    let res=client.post("https://open.bigmodel.cn/api/paas/v4/chat/completions")
    .header("Authorization", format!("Bearer {}", model_token))
    .header("Content-Type", "application/json")
    .body(serde_json::to_string(&ModelQuery{
        model: "glm-4-plus".to_string(),
        messages: vec![
            Message{
                role: "user".to_string(),
                content: format!("请将以下新闻内容逐条进行简短概括，并输出标题和概括内容，请按markdown格式回答\n\n{}", news_string)
            }
        ]
    })?)
    .send().await?;

    let res = res.text().await?;
    
    Ok(res)
}

fn parse_dom(html: &str) -> Result<String, Box<dyn Error>> {
    let dom_parser = Html::parse_document(html);
    let selector =  Selector::parse("#content div.post_body p")?;
    let mut result = String::new();
    for node in dom_parser.select(&selector) {
        result.push_str(&node.text().collect::<String>());
    }
    Ok(result)
}