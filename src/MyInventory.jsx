import { useCallback, useEffect, useRef, useState } from "react";
import { useStaff } from "./StaffContext";
import { toast } from "react-toastify";
import CleaningTheme, { CleaningSparkle } from "./CleaningTheme";

export default function MyInventory() {
  const { authAxios } = useStaff();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [usingId, setUsingId] = useState(null);
  const mounted = useRef(false);
  const actionLock = useRef(false);
  const requestId = useRef(0);

  const load = useCallback(async () => {
    const id = ++requestId.current;
    setLoading(true);
    setError("");
    try {
      const res = await authAxios.get("/staff/inventory");
      if (mounted.current && id === requestId.current) setItems(res.data.items || []);
    } catch {
      if (mounted.current && id === requestId.current) {
        setError("Could not refresh your supplies. Please try again.");
        toast.error("Failed to load inventory");
      }
    } finally {
      if (mounted.current && id === requestId.current) setLoading(false);
    }
  }, [authAxios]);

  useEffect(() => {
    mounted.current = true;
    load();
    return () => { mounted.current = false; requestId.current++; };
  }, [load]);

  const useItem = async item => {
    if (actionLock.current || loading || error || Number(item.quantity) <= 0) return;
    actionLock.current = true;
    setUsingId(item.item_id);
    try {
      await authAxios.post("/staff/inventory/use", { item_id: item.item_id, quantity: 1 });
      toast.success("Item marked as used");
      if (mounted.current) await load();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to use item");
    } finally {
      actionLock.current = false;
      if (mounted.current) setUsingId(null);
    }
  };

  const needsMore = items.filter(item => Number(item.quantity) < Number(item.required_quantity)).length;
  const busy = loading || usingId !== null;

  return <CleaningTheme className="mi-theme">
    <style>{styles}</style>
    <section className="mi-panel" aria-label="My cleaning inventory" aria-busy={busy}>
      <header className="mi-header">
        <span className="mi-mark" aria-hidden="true"><CleaningSparkle /></span>
        <div className="mi-heading"><p>Ready for a fresh start</p><h2>My cleaning supplies</h2></div>
        <button type="button" className="mi-refresh" onClick={load} disabled={busy} aria-label="Refresh inventory">{loading ? "Refreshing…" : "↻ Refresh"}</button>
      </header>
      <p className="mi-intro">Your assigned supplies, all in one place. Tap “Use 1” when you use one unit.</p>
      {items.length > 0 && <div className="mi-summary"><span><strong>{items.length}</strong> supply types</span><span className={needsMore ? "mi-low" : "mi-good"}>{needsMore ? `${needsMore} below requirement` : "All requirements met"}</span></div>}
      {error && <p className="mi-error" role="alert">{error}</p>}
      {loading && items.length === 0 && <p className="mi-empty" role="status">Loading your inventory…</p>}
      {!loading && !error && items.length === 0 && <div className="mi-empty"><span aria-hidden="true">✦</span><strong>Your supply kit is waiting</strong><p>You don’t have any assigned inventory yet.</p></div>}
      <div className="mi-grid">
        {items.map(item => {
          const quantity = Number(item.quantity) || 0;
          const required = Number(item.required_quantity) || 0;
          const met = quantity >= required;
          const name = item.item_name || "Cleaning supply";
          const percent = required > 0 ? Math.max(0, Math.min(100, quantity / required * 100)) : 100;
          return <article key={item.item_id} className={`mi-item ${met ? "is-stocked" : "is-low"}`}>
            <div className="mi-item-top">
              <div className="mi-image">{item.item_image_url ? <img src={item.item_image_url} alt={name} loading="lazy" /> : <span aria-hidden="true">{name.charAt(0).toUpperCase()}</span>}</div>
              <div className="mi-item-name"><h3>{name}</h3><span className={`mi-status ${met ? "mi-good" : "mi-low"}`}>{met ? "✓ Requirement met" : "Needs more"}</span></div>
            </div>
            <div className="mi-stock"><div><strong>{quantity}</strong><span>on hand</span></div><span>{required} required</span></div>
            <div className="mi-meter" aria-hidden="true"><span style={{width:`${percent}%`}} /></div>
            <footer className="mi-item-footer"><small>{met ? "Ready for your next cleaning" : `${Math.max(0, required - quantity)} more needed`}</small><button type="button" onClick={() => useItem(item)} disabled={busy || Boolean(error) || quantity <= 0} aria-label={`Use one unit of ${name}`}>{usingId === item.item_id ? "Saving…" : quantity <= 0 ? "Out of stock" : "Use 1"}</button></footer>
          </article>;
        })}
      </div>
    </section>
  </CleaningTheme>;
}

const styles = `
.cleaning-theme.mi-theme{min-height:0;border-radius:20px;background:radial-gradient(ellipse at top right,#1d617247,transparent 65%),#071321;overflow:visible}.cleaning-theme .mi-theme .ct-page-atmosphere{display:none}.mi-panel{position:relative;padding:22px;border:1px solid #7dd3fc30;border-radius:20px;color:#e0f1fa;min-width:0}.mi-header{display:flex;align-items:center;gap:11px}.mi-mark{display:grid;place-items:center;flex-shrink:0;width:40px;height:40px;border:1px solid #83ebd945;border-radius:12px;background:#163c49;color:#a3f2dc}.mi-mark svg{width:23px;height:23px}.mi-heading{min-width:0}.mi-heading p{font-size:9px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#93d8df;margin:0 0 4px!important}.mi-heading h2{margin:0;font-size:21px;line-height:1.3;font-weight:700;letter-spacing:-.03em}.mi-refresh{margin-left:auto;flex-shrink:0;min-height:44px;padding:9px 12px;background:#153249;border:1px solid #7dd3fc40;border-radius:10px;color:#c2edf1;font-size:11px;font-weight:650;cursor:pointer}.mi-intro{font-size:12px;line-height:1.8;color:#9fbfd1;margin:13px 0!important}.mi-summary{display:flex;flex-wrap:wrap;align-items:center;gap:9px 16px;font-size:11px;padding:12px 0 16px;color:#abc9d9}.mi-summary strong{font-size:14px;color:#e1f2fb;margin-right:3px}.mi-good{color:#a4edce}.mi-low{color:#f1d49c}.mi-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,280px),1fr));gap:12px}.mi-item{padding:16px;background:linear-gradient(125deg,#132d42,#0d2034);border:1px solid #7dd3fc30;border-radius:15px;min-width:0}.mi-item.is-low{border-color:#dec18b44}.mi-item-top{display:flex;align-items:center;gap:12px}.mi-image{width:48px;height:48px;flex-shrink:0;border-radius:12px;border:1px solid #8fd9e438;background:#1b4050;overflow:hidden;display:grid;place-items:center;color:#b8f3e5;font-size:19px;font-weight:700}.mi-image img{width:100%;height:100%;object-fit:cover}.mi-item-name{min-width:0;flex:1}.mi-item h3{font-size:14px;font-weight:650;line-height:1.5;margin:0 0 4px;overflow-wrap:anywhere}.mi-status{font-size:10px;line-height:1.5}.mi-stock{display:flex;align-items:baseline;justify-content:space-between;gap:10px;margin-top:17px;color:#a2c0d2;font-size:11px}.mi-stock>div{display:flex;align-items:baseline;gap:7px}.mi-stock strong{font-size:25px;line-height:1.2;font-weight:700;letter-spacing:-.03em;color:#e0f2fa}.mi-meter{height:5px;overflow:hidden;background:#244256;border-radius:99px;margin:10px 0 14px}.mi-meter>span{display:block;height:100%;border-radius:inherit;background:linear-gradient(90deg,#82d5f0,#84e5c2)}.is-low .mi-meter>span{background:linear-gradient(90deg,#d7bd87,#f0d79e)}.mi-item-footer{display:flex;align-items:center;justify-content:space-between;gap:12px}.mi-item-footer small{font-size:10px;line-height:1.6;color:#97b8ca}.mi-item-footer button{min-height:44px;flex-shrink:0;padding:10px 15px;border:1px solid #99e6d766;border-radius:10px;background:linear-gradient(110deg,#a0dcf2,#8be4cc);color:#103441;font-size:12px;font-weight:750;cursor:pointer}.mi-panel button:hover:not(:disabled){filter:brightness(1.08)}.mi-panel button:disabled{opacity:.5;cursor:not-allowed}.mi-panel button:focus-visible{outline:3px solid #a6f4df;outline-offset:3px}.mi-empty{padding:27px 16px;border:1px dashed #7dd3fc38;border-radius:13px;text-align:center;color:#9dbdd0;font-size:12px;line-height:1.7;background:#0d2235}.mi-empty>span{display:block;font-size:27px;color:#a2ead8;margin-bottom:8px}.mi-empty strong{display:block;font-size:15px;color:#d9eff8}.mi-empty p{margin:7px 0 0!important}.mi-error{padding:12px;border:1px solid #f0a4bf44;border-radius:11px;background:#43243a;color:#ffd1e2;font-size:12px;line-height:1.7;margin:12px 0!important}
@media(max-width:640px){.mi-panel{padding:13px;border-radius:16px}.mi-header{gap:8px;flex-wrap:wrap}.mi-mark{width:34px;height:34px}.mi-mark svg{width:20px;height:20px}.mi-heading{flex:1}.mi-heading h2{font-size:17px}.mi-heading p{font-size:8px;letter-spacing:.06em}.mi-refresh{font-size:10px;padding:8px;min-height:44px}.mi-intro{font-size:11px}.mi-item{padding:13px}.mi-grid{gap:10px}.mi-item-footer button{min-width:82px}}
`;
