/* ============================================================
   data-catalog.js — Produits, ventes, stock, fournisseurs, stats
   Les vues n'appellent QUE ces modules : la bascule
   démo <-> Supabase est donc transparente.
   ============================================================ */

/* Assemble un produit avec ses variantes (mode démo) */
function _withVariants(product, db, includePurchasePrice = true){
  const variants = db.product_variants
    .filter(v => v.product_id === product.id)
    .sort((a,b)=>a.display_order-b.display_order)
    .map(v => includePurchasePrice ? v : { ...v, purchase_price:0 });
  return { ...product, category: db.categories.find(c=>c.id===product.category_id) || null, variants };
}

const Products = {
  async _all(includePurchasePrice){
    if(DEMO_MODE){
      const db = DemoDB.load();
      return db.products.slice()
        .sort((a,b)=>a.display_order-b.display_order)
        .map(p=>_withVariants(p, db, includePurchasePrice));
    }
    const select = includePurchasePrice
      ? "*,category:categories(*),variants:product_variants(*)"
      : "id,name,category_id,description,active,visible,display_order,created_at,category:categories(*),variants:product_variants(id,product_id,label,code,photo_url,sale_price,stock,min_stock,unit,volume_cl,display_order,is_default)";
    const { data, error } = await sb().from("products").select(select).order("display_order");
    if(error) throw new Error(error.message);
    return (data||[]).map(p=>({
      ...p,
      variants:(p.variants||[])
        .map(v=>includePurchasePrice ? v : { ...v, purchase_price:0 })
        .sort((a,b)=>a.display_order-b.display_order)
    }));
  },
  async listActive(){ return (await this._all(false)).filter(p=>p.active); },
  async listPublic(){ return (await this._all(false)).filter(p=>p.active && p.visible); },
  async listAll(){ return this._all(true); },

  async listCategories(){
    if(DEMO_MODE) return DemoDB.load().categories.slice().sort((a,b)=>a.display_order-b.display_order);
    const { data } = await sb().from("categories").select("*").order("display_order");
    return data || [];
  },

  async save(product, variants){
    if(DEMO_MODE){
      const db = DemoDB.load();
      if(product.id){
        const i = db.products.findIndex(p=>p.id===product.id);
        db.products[i] = { ...db.products[i], ...product };
      }else{
        product.id = uid();
        product.created_at = new Date().toISOString();
        product.display_order = db.products.length+1;
        db.products.push(product);
      }
      const keptIds = variants.filter(v=>v.id).map(v=>v.id);
      db.product_variants = db.product_variants.filter(v => v.product_id !== product.id || keptIds.includes(v.id));
      variants.forEach((v,i)=>{
        v.product_id = product.id; v.display_order = i; v.is_default = variants.length===1;
        if(v.id){
          const idx = db.product_variants.findIndex(x=>x.id===v.id);
          if(idx>=0) db.product_variants[idx] = { ...db.product_variants[idx], ...v };
          else db.product_variants.push(v);
        }else{
          v.id = uid(); db.product_variants.push(v);
        }
      });
      DemoDB.save();
      return { ok:true };
    }

    const supa = sb();
    let productId = product.id;
    if(productId){
      const { error } = await supa.from("products").update(product).eq("id", productId);
      if(error) throw new Error(error.message);
    }else{
      const { data, error } = await supa.from("products").insert(product).select("id").single();
      if(error) throw new Error(error.message);
      productId = data.id;
    }

    /* Supprime les variantes retirées dans le formulaire */
    const keptIds = variants.filter(v=>v.id).map(v=>v.id);
    const { data: existing } = await supa.from("product_variants").select("id").eq("product_id", productId);
    for(const row of (existing||[])){
      if(!keptIds.includes(row.id)) await supa.from("product_variants").delete().eq("id", row.id);
    }

    const single = variants.length === 1;
    for(let i=0;i<variants.length;i++){
      const v = { ...variants[i], product_id:productId, display_order:i, is_default:single };
      if(v.id){
        const { error } = await supa.from("product_variants").update(v).eq("id", v.id);
        if(error) throw new Error(error.message);
      }else{
        delete v.id;
        const { error } = await supa.from("product_variants").insert(v);
        if(error) throw new Error(error.message);
      }
    }
    return { ok:true };
  },

  async toggleActive(id, active){
    if(DEMO_MODE){
      const db = DemoDB.load();
      const p = db.products.find(x=>x.id===id);
      if(p) p.active = active;
      DemoDB.save(); return;
    }
    const { error } = await sb().from("products").update({ active }).eq("id", id);
    if(error) throw new Error(error.message);
  },

  async remove(id){
    if(DEMO_MODE){
      const db = DemoDB.load();
      db.products = db.products.filter(p=>p.id!==id);
      db.product_variants = db.product_variants.filter(v=>v.product_id!==id);
      DemoDB.save(); return;
    }
    const { error } = await sb().from("products").delete().eq("id", id);
    if(error) throw new Error(error.message);
  }
};

const Sales = {
  async create(lines){
    if(DEMO_MODE){
      const db = DemoDB.load();
      for(const l of lines){
        const v = db.product_variants.find(x=>x.id===l.variantId);
        if(!v || v.stock < l.qty) throw new Error("Stock insuffisant pour " + l.productName);
      }
      const saleId = uid(), now = new Date().toISOString();
      let total=0, count=0;
      for(const l of lines){
        const v = db.product_variants.find(x=>x.id===l.variantId);
        const line = v.sale_price*l.qty;
        total += line; count += l.qty; v.stock -= l.qty;
        db.sale_items.push({ id:uid(), sale_id:saleId, variant_id:v.id, product_name:l.productName,
          qty:l.qty, unit_price:v.sale_price, line_total:line, created_at:now });
        db.stock_movements.unshift({ id:uid(), variant_id:v.id, type:"sale", qty_delta:-l.qty,
          stock_after:v.stock, reason:"Vente caisse", created_at:now });
      }
      total = Math.round(total*100)/100;
      db.sales.unshift({ id:saleId, total, item_count:count, created_at:now });
      DemoDB.save();
      return { sale_id:saleId, total, item_count:count };
    }
    const items = lines.map(l=>({ variant_id:l.variantId, qty:l.qty }));
    const { data, error } = await sb().rpc("create_sale", { items });
    if(error) throw new Error(error.message);
    return Array.isArray(data) ? data[0] : data;
  },

  async recent(limit=8){
    if(DEMO_MODE) return DemoDB.load().sales.slice(0,limit);
    const { data } = await sb().from("sales").select("*").order("created_at",{ascending:false}).limit(limit);
    return data || [];
  },

  async list(from,to){
    if(DEMO_MODE){
      const db = DemoDB.load();
      let rows = db.sales.slice().sort((a,b)=>b.created_at.localeCompare(a.created_at));
      if(from) rows = rows.filter(s=>s.created_at >= from);
      if(to)   rows = rows.filter(s=>s.created_at <= to+"T23:59:59");
      return rows.map(s=>({ ...s, items: db.sale_items.filter(it=>it.sale_id===s.id) }));
    }
    let q = sb().from("sales").select("*,items:sale_items(*)").order("created_at",{ascending:false}).limit(200);
    if(from) q = q.gte("created_at", new Date(from).toISOString());
    if(to){ const end = new Date(to); end.setHours(23,59,59,999); q = q.lte("created_at", end.toISOString()); }
    const { data } = await q;
    return data || [];
  },

  async allItems(){
    if(DEMO_MODE) return DemoDB.load().sale_items.slice();
    const { data } = await sb().from("sale_items").select("*");
    return data || [];
  }
};

const Stock = {
  async adjust({ variantId, value, mode, type, reason }){
    if(DEMO_MODE){
      const db = DemoDB.load();
      const v = db.product_variants.find(x=>x.id===variantId);
      if(!v) throw new Error("Produit introuvable");
      const newStock = mode==="add" ? v.stock + value : value;
      if(newStock < 0) throw new Error("Le stock ne peut pas être négatif");
      const delta = newStock - v.stock;
      v.stock = newStock;
      db.stock_movements.unshift({ id:uid(), variant_id:v.id, type, qty_delta:delta,
        stock_after:newStock, reason:reason||null, created_at:new Date().toISOString() });
      DemoDB.save();
      return newStock;
    }
    const { data, error } = await sb().rpc("adjust_stock",
      { p_variant_id:variantId, p_value:value, p_mode:mode, p_type:type, p_reason:reason||null });
    if(error) throw new Error(error.message);
    return data;
  },

  async movements(){
    if(DEMO_MODE){
      const db = DemoDB.load();
      return db.stock_movements.map(m=>{
        const v = db.product_variants.find(x=>x.id===m.variant_id);
        const p = v ? db.products.find(x=>x.id===v.product_id) : null;
        return { ...m, variant: v ? { label:v.label, product: p?{name:p.name}:null } : null };
      });
    }
    const { data } = await sb()
      .from("stock_movements")
      .select("*,variant:product_variants(label,product:products(name))")
      .order("created_at",{ascending:false}).limit(200);
    return data || [];
  },

  async recordPurchase({ supplierId, variantId, qty, unitPrice, supplierRef, date }){
    if(DEMO_MODE){
      const db = DemoDB.load();
      db.purchases.unshift({ id:uid(), supplier_id:supplierId, variant_id:variantId, qty,
        unit_purchase_price:unitPrice, total_cost:Math.round(qty*unitPrice*100)/100,
        supplier_ref:supplierRef||null, purchase_date:date, created_at:new Date().toISOString() });
      await this.adjust({ variantId, value:qty, mode:"add", type:"restock", reason:"Achat fournisseur" });
      DemoDB.save();
      return { ok:true };
    }
    const { error } = await sb().rpc("record_purchase", {
      p_supplier_id:supplierId, p_variant_id:variantId, p_qty:qty,
      p_unit_price:unitPrice, p_supplier_ref:supplierRef||null, p_date:date });
    if(error) throw new Error(error.message);
    return { ok:true };
  },

  async purchases(limit=12){
    if(DEMO_MODE){
      const db = DemoDB.load();
      return db.purchases.slice(0,limit).map(p=>({ ...p, supplier: db.suppliers.find(s=>s.id===p.supplier_id)||null }));
    }
    const { data } = await sb().from("purchases").select("*,supplier:suppliers(*)")
      .order("purchase_date",{ascending:false}).limit(limit);
    return data || [];
  },

  /* Mise à jour directe d'une variante (utilisée par l'import CSV) */
  async updateVariant(variantId, fields){
    if(DEMO_MODE){
      const db = DemoDB.load();
      const v = db.product_variants.find(x=>x.id===variantId);
      if(!v) throw new Error("Variante introuvable");
      Object.assign(v, fields);
      DemoDB.save(); return;
    }
    const { error } = await sb().from("product_variants").update(fields).eq("id", variantId);
    if(error) throw new Error(error.message);
  }
};

const Suppliers = {
  async list(){
    if(DEMO_MODE) return DemoDB.load().suppliers.slice().sort((a,b)=>a.name.localeCompare(b.name));
    const { data } = await sb().from("suppliers").select("*").order("name");
    return data || [];
  },
  async save(s){
    if(DEMO_MODE){
      const db = DemoDB.load();
      if(s.id){ const i = db.suppliers.findIndex(x=>x.id===s.id); db.suppliers[i] = { ...db.suppliers[i], ...s }; }
      else{ s.id = uid(); s.created_at = new Date().toISOString(); db.suppliers.push(s); }
      DemoDB.save(); return { ok:true };
    }
    const { error } = s.id
      ? await sb().from("suppliers").update(s).eq("id", s.id)
      : await sb().from("suppliers").insert(s);
    if(error) throw new Error(error.message);
    return { ok:true };
  },
  async remove(id){
    if(DEMO_MODE){
      const db = DemoDB.load();
      db.suppliers = db.suppliers.filter(s=>s.id!==id);
      DemoDB.save(); return;
    }
    const { error } = await sb().from("suppliers").delete().eq("id", id);
    if(error) throw new Error(error.message);
  }
};

const Stats = {
  async dashboard(){
    const sales = DEMO_MODE
      ? DemoDB.load().sales
      : ((await sb().from("sales").select("total,created_at")).data || []);
    const start = new Date(); start.setHours(0,0,0,0);
    const today = sales.filter(s=>new Date(s.created_at) >= start);
    return {
      todayRevenue: today.reduce((a,s)=>a+Number(s.total),0),
      todayCount:   today.length,
      totalRevenue: sales.reduce((a,s)=>a+Number(s.total),0),
      totalSales:   sales.length
    };
  },
  async topProducts(limit=8){
    const items = await Sales.allItems();
    const map = new Map();
    for(const it of items){
      const cur = map.get(it.product_name) || { product_name:it.product_name, qty:0, revenue:0 };
      cur.qty += it.qty; cur.revenue += Number(it.line_total);
      map.set(it.product_name, cur);
    }
    return [...map.values()].sort((a,b)=>b.qty-a.qty).slice(0,limit);
  },
  async dailyRevenue(days=14){
    const sales = DEMO_MODE
      ? DemoDB.load().sales
      : ((await sb().from("sales").select("total,created_at")).data || []);
    const since = new Date(); since.setDate(since.getDate()-days);
    const map = new Map();
    for(const s of sales){
      const d = new Date(s.created_at);
      if(d < since) continue;
      const key = `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}`;
      map.set(key, (map.get(key)||0) + Number(s.total));
    }
    return [...map.entries()].map(([day,revenue])=>({ day, revenue }));
  }
};
