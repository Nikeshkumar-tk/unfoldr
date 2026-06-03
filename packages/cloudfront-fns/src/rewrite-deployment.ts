export function getRewriteDeploymentCode(): string {
  return `
function handler(event) {
  var request = event.request;
  var hostHeader = request.headers && request.headers.host;
  if (!hostHeader || !hostHeader.value) {
    return request;
  }
  var host = hostHeader.value;
  var projectId = host.split(".")[0];
  if (request.uri.indexOf("/deployments/") === 0) {
    return request;
  }
  var uri = request.uri || "/";
  var lastSegment = uri.substring(uri.lastIndexOf("/") + 1);
  var isFileRequest = lastSegment.indexOf(".") !== -1;
  if (isFileRequest) {
    request.uri = "/deployments/" + projectId + uri;
  } else {
    request.uri = "/deployments/" + projectId + "/index.html";
  }
  return request;
}`;
}
