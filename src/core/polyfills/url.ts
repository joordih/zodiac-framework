const globalObj = typeof global !== 'undefined' ? global : 
                  typeof window !== 'undefined' ? window : 
                  typeof globalThis !== 'undefined' ? globalThis : {};


const URL = (globalObj as any).URL || require('url').URL;
const URLSearchParams = (globalObj as any).URLSearchParams || require('url').URLSearchParams;

export function parse(url: string) {
  const parsedUrl = new URL(url);
  return {
    protocol: parsedUrl.protocol,
    slashes: true,
    auth: parsedUrl.username + (parsedUrl.password ? ':' + parsedUrl.password : ''),
    host: parsedUrl.host,
    port: parsedUrl.port,
    hostname: parsedUrl.hostname,
    hash: parsedUrl.hash,
    search: parsedUrl.search,
    query: parsedUrl.search.substr(1),
    pathname: parsedUrl.pathname,
    path: parsedUrl.pathname + parsedUrl.search,
    href: parsedUrl.href
  };
}

export function format(urlObject: any) {
  const url = new URL('http://placeholder');
  if (urlObject.protocol) url.protocol = urlObject.protocol;
  if (urlObject.hostname) url.hostname = urlObject.hostname;
  if (urlObject.port) url.port = urlObject.port;
  if (urlObject.pathname) url.pathname = urlObject.pathname;
  if (urlObject.search) url.search = urlObject.search;
  if (urlObject.hash) url.hash = urlObject.hash;
  return url.href.replace('http://placeholder', '');
}

export {
  URL,
  URLSearchParams
};

export default {
  URL,
  URLSearchParams,
  parse,
  format
}; 