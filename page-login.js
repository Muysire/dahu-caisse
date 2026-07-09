/* ============================================================
   demo-data.js — Base d'exemple locale (mode démo uniquement)
   Persistée dans le localStorage du navigateur.
   ============================================================ */

const DEMO_KEY = "dahu-demo-db-v3";

function seedDemoDB(){
  const cB=uid(), cS=uid(), cA=uid(), cSn=uid(), sup=uid();

  const categories = [
    {id:cB,  name:"Bières",  slug:"bieres",  icon:"🍺", display_order:1},
    {id:cS,  name:"Softs",   slug:"softs",   icon:"🥤", display_order:2},
    {id:cA,  name:"Alcools", slug:"alcools", icon:"🥃", display_order:3},
    {id:cSn, name:"Snacks",  slug:"snacks",  icon:"🍿", display_order:4}
  ];

  const products = [], variants = [];
  function add(name, categoryId, description, variantList){
    const pid = uid();
    products.push({
      id:pid, name, category_id:categoryId, description:description||null,
      active:true, visible:true, display_order:products.length+1,
      created_at:new Date().toISOString()
    });
    variantList.forEach((v,i)=>variants.push({
      id:uid(), product_id:pid, label:v.label, code:v.code||null,
      photo_url:v.photo||null,                 // ← photo par variante
      purchase_price:v.pa, sale_price:v.pv,
      stock:v.stock, min_stock:v.min,
      unit:v.unit||"unité", volume_cl:v.vol ?? null,
      display_order:i, is_default:variantList.length===1
    }));
  }

  add("Bière Blonde", cB, "Pression maison", [
    {label:"25 cl", code:"BIE-25", pa:.6,  pv:2.5, stock:200, min:40, unit:"verre", vol:25},
    {label:"50 cl", code:"BIE-50", pa:1.1, pv:4.5, stock:100, min:20, unit:"verre", vol:50}
  ]);
  add("Bière Ambrée", cB, "Artisanale locale", [
    {label:"33 cl", code:"AMB-33", pa:1, pv:3.5, stock:18, min:20, unit:"bouteille", vol:33}
  ]);
  add("Coca-Cola", cS, null, [
    {label:"Canette 33 cl",  code:"COCA-33", pa:.45, pv:2,   stock:120, min:24, unit:"canette",   vol:33},
    {label:"Bouteille 50 cl",code:"COCA-50", pa:.7,  pv:2.5, stock:8,   min:12, unit:"bouteille", vol:50}
  ]);
  add("Eau plate", cS, null, [
    {label:"50 cl", code:"EAU-50", pa:.2, pv:1, stock:150, min:30, unit:"bouteille", vol:50}
  ]);
  add("Rhum Arrangé", cA, "Maison, vanille", [
    {label:"Shot 4 cl", code:"RHUM-04", pa:.9, pv:4, stock:0, min:15, unit:"shot", vol:4}
  ]);
  add("Punch Dahu", cA, "Recette secrète 🔥", [
    {label:"Verre 20 cl", code:"PUNCH", pa:1.2, pv:5, stock:60, min:15, unit:"verre", vol:20}
  ]);
  add("Chips", cSn, null, [
    {label:"Sachet", code:"CHIPS", pa:.5, pv:1.5, stock:50, min:10, unit:"sachet"}
  ]);
  add("Cacahuètes", cSn, null, [
    {label:"Sachet", code:"CACA", pa:.4, pv:1.5, stock:6, min:10, unit:"sachet"}
  ]);

  const suppliers = [{
    id:sup, name:"Grossiste Boissons 74", contact:"Jean Michel",
    phone:"04 50 00 00 00", email:"contact@gb74.fr",
    notes:"Livraison le mardi", created_at:new Date().toISOString()
  }];

  /* Génère ~7 jours de ventes pour peupler les stats */
  const sales=[], saleItems=[], movements=[];
  const now = Date.now();
  for(let d=6; d>=0; d--){
    const nbSales = 3 + Math.floor(Math.random()*5);
    for(let s=0; s<nbSales; s++){
      const sid = uid();
      const when = new Date(now - d*864e5 - Math.random()*8e7).toISOString();
      const nbItems = 1 + Math.floor(Math.random()*3);
      let total=0, count=0;
      for(let it=0; it<nbItems; it++){
        const v   = variants[Math.floor(Math.random()*variants.length)];
        const qty = 1 + Math.floor(Math.random()*3);
        const p   = products.find(x=>x.id===v.product_id);
        const line = v.sale_price*qty;
        total += line; count += qty;
        saleItems.push({
          id:uid(), sale_id:sid, variant_id:v.id,
          product_name:`${p.name} — ${v.label}`,
          qty, unit_price:v.sale_price, line_total:line, created_at:when
        });
      }
      sales.push({id:sid, total:Math.round(total*100)/100, item_count:count, created_at:when});
    }
  }

  return {
    categories, products, product_variants:variants, suppliers,
    sales, sale_items:saleItems, stock_movements:movements, purchases:[],
    profiles:[
      {id:"demo-admin",  username:"Théo", role:"admin",  active:true, created_at:new Date().toISOString()},
      {id:"demo-barman", username:"Léo",  role:"barman", active:true, created_at:new Date().toISOString()}
    ]
  };
}

const DemoDB = {
  data:null,
  load(){
    if(this.data) return this.data;
    try{
      const raw = localStorage.getItem(DEMO_KEY);
      if(raw){ this.data = JSON.parse(raw); return this.data; }
    }catch(e){ /* données corrompues : on repart d'un seed */ }
    this.data = seedDemoDB(); this.save(); return this.data;
  },
  save(){
    try{ localStorage.setItem(DEMO_KEY, JSON.stringify(this.data)); }
    catch(e){ toast("Stockage local plein (photos trop lourdes ?)","error"); }
  },
  reset(){ this.data = seedDemoDB(); this.save(); }
};
