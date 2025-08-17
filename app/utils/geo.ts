// app/utils/geo.ts
export function metersBetween(a:{lat:number,lng:number}, b:{lat:number,lng:number}) {
    const R = 6371000, toRad = (x:number)=> x*Math.PI/180;
    const dLat = toRad(b.lat - a.lat);
    const dLon = toRad(b.lng - a.lng);
    const lat1 = toRad(a.lat), lat2 = toRad(b.lat);
    const sinDLat = Math.sin(dLat/2), sinDLon = Math.sin(dLon/2);
    const h = sinDLat*sinDLat + Math.cos(lat1)*Math.cos(lat2)*sinDLon*sinDLon;
    return 2*R*Math.asin(Math.sqrt(h));
}
