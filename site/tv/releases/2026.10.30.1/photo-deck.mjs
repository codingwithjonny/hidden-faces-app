export function createPhotoDeck({size=6,random=Math.random}={}) {
  let library=new Map(),pending=[],bag=[],current=[];
  function shuffle(items) {
    const result=[...items];
    for(let i=result.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[result[i],result[j]]=[result[j],result[i]];}
    return result;
  }
  return {
    sync(photos) {
      if(!Array.isArray(photos))throw new Error('Invalid photo feed');
      const next=new Map(photos.filter(p=>p&&typeof p.id==='string'&&typeof p.url==='string').map(p=>[p.id,p]));
      const added=[...next.keys()].filter(id=>!library.has(id));
      pending=[...new Set([...shuffle(added),...pending.filter(id=>next.has(id))])];
      bag=bag.filter(id=>next.has(id));current=current.filter(id=>next.has(id));library=next;
      return {added:added.length,total:library.size};
    },
    next() {
      const selected=[],shown=new Set(current),target=Math.min(size,library.size);
      while(selected.length<target) {
        const usable=id=>library.has(id)&&!selected.includes(id);
        let id=pending.find(id=>usable(id)&&!shown.has(id))??bag.find(id=>usable(id)&&!shown.has(id));
        if(id===undefined){
          const fresh=shuffle([...library.keys()].filter(id=>usable(id)&&!shown.has(id)));
          bag=[...bag.filter(usable),...fresh.filter(id=>!bag.includes(id))];
          id=fresh[0]??pending.find(usable)??bag.find(usable)??shuffle([...library.keys()].filter(usable))[0];
        }
        if(id===undefined)break;
        selected.push(id);pending=pending.filter(item=>item!==id);bag=bag.filter(item=>item!==id);
      }
      let order=shuffle(selected);
      if(order.length>1&&order.every((id,i)=>current[i]===id))order=[...order.slice(1),order[0]];
      current=order;
      return order.map(id=>library.get(id));
    },
    has(id){return library.has(id);},
    get count(){return library.size;},
  };
}
