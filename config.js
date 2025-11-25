const API_HOST = "https://api.spelltide.games";
const SERVER_HOST = "https://spelltide-games.github.io/map-editor";

const OIDC_CONFIG = {
    authority: "https://dev-2lkojq.us1.zitadel.cloud/",
    client_id: "345893480377180537",
    redirect_uri: SERVER_HOST + "/callback.html",
    response_type: "code",
    scope: "openid profile email",
    post_logout_redirect_uri: SERVER_HOST + "/"
};

async function queryGrist(q) {
    const fullUrl = API_HOST + `/grist/sql?q=${encodeURIComponent(q)}`;
    const resp = await fetch(fullUrl);
    const data = await resp.json();
    if (data.error) {
        throw new Error(data.error);
    }
    return data;
}