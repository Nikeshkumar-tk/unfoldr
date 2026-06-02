export function getRewriteDeploymentCode(): string {
  return `
function handler(event) {
  var request = event.request;
  console.log("Event", JSON.stringify(event));
  var uri = request.uri;
  if (uri === "/" || uri === "") {
    return request;
  }
  if (uri.indexOf("/deployments/") === 0) {
    return request;
  }
  var path = uri.substring(1);
  var segments = path.split("/");
  if (segments[0].indexOf(".") !== -1) {
    return request;
  }
  var deploymentId = segments[0];
  if (deploymentId.indexOf(".") === -1 && segments.length === 1) {
    // /{deploymentId} or /{deploymentId}/ → SPA entry point
    request.uri = "/deployments/" + deploymentId + "/index.html";
  } else if (deploymentId.indexOf(".") === -1) {
    // /{deploymentId}/assets/... → asset file
    request.uri = "/deployments/" + path;
  } else {
    // /assets/... — no deployment ID in URL, extract from Referer header
    var refererHeader = "";
    for (var h in request.headers) {
      if (h.toLowerCase() === "referer") {
        refererHeader = request.headers[h][0].value;
        break;
      }
    }
    if (refererHeader) {
      // Parse deployment ID from Referer: https://domain.tld/{deploymentId}/...
      var refererParts = refererHeader.split("/");
      // refererParts = ["https:", "", "domain.tld", "{deploymentId}", ...]
      if (refererParts.length >= 4) {
        var refDeploymentId = refererParts[3];
        if (refDeploymentId.indexOf(".") === -1) {
          request.uri = "/deployments/" + refDeploymentId + "/" + path;
        }
      }
    }
  }
  return request;
}`;
}
