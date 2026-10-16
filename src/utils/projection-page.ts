/** Shared carousel cycle advances dense agendas without changing their allotted duration. */
export function projectionPage<T>(items:readonly T[],cycle:number,size=4){
 const pages=Math.max(1,Math.ceil(items.length/size));
 const page=((Math.floor(cycle)%pages)+pages)%pages;
 return {items:items.slice(page*size,(page+1)*size),page:page+1,pages};
}
