const toWs = (url: string) => url.replace(/^http(s?):\/\//, 'ws$1://');
export const CONFIG = {
    API_BASE_URL: 'https://be5e7175e46b.ngrok-free.app',
    WS_BASE_URL:  toWs('https://be5e7175e46b.ngrok-free.app'),
    CURRENCY: 'RWF'
};
