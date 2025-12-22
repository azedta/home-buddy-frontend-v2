// src/components/robot/RobotControlCard.jsx
import { useMemo, useState } from "react";
import { issueRobotCommand } from "../../features/robotApi.js";
import { Send, MapPin, Package, PlugZap } from "lucide-react";

const LOCATIONS = ["LIVING_ROOM", "KITCHEN", "BEDROOM", "BATHROOM", "HALLWAY", "DINING_ROOM", "DOCK"];

export default function RobotControlCard({ status, onCommandIssued }) {
  const [commandType, setCommandType] = useState("MOVE_TO_LOCATION");
  const [targetLocation, setTargetLocation] = useState("LIVING_ROOM");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const needsTarget = useMemo(() => {
    return commandType === "MOVE_TO_LOCATION" || commandType === "DELIVER_ITEMS";
  }, [commandType]);

  const icon = useMemo(() => {
    if (commandType === "RETURN_TO_DOCK") return PlugZap;
    if (commandType === "DELIVER_ITEMS") return Package;
    return MapPin;
  }, [commandType]);

  async function submit(e) {
    e.preventDefault();
    setErr("");
    setMsg("");
    setLoading(true);

    try {
      await issueRobotCommand({
        commandType,
        targetLocation: needsTarget ? targetLocation : "DOCK",
        description: description?.trim() || undefined,
      });

      setMsg("Command issued successfully.");
      setDescription("");

      if (onCommandIssued) await onCommandIssued();
    } catch (e2) {
      setErr(e2?.message || "Failed to issue command");
    } finally {
      setLoading(false);
    }
  }

  const Icon = icon;

  return (
    <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold tracking-widest text-slate-500">ROBOT CONTROL</p>
          <h3 className="mt-2 text-lg font-extrabold text-slate-900">Remote command console</h3>
          <p className="mt-1 text-sm text-slate-600">
            Issue a command — backend will log activities and update live state.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700">
          Current: {status?.currentLocation || "—"}
        </div>
      </div>

      <form onSubmit={submit} className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="text-xs font-bold tracking-widest text-slate-500">COMMAND TYPE</label>
          <div className="mt-2 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-blue-50 via-cyan-50 to-indigo-50 ring-1 ring-slate-200">
              <Icon className="h-5 w-5 text-slate-700" />
            </div>

            <select
              value={commandType}
              onChange={(e) => setCommandType(e.target.value)}
              className="w-full bg-transparent text-sm font-semibold text-slate-900 outline-none"
            >
              <option value="MOVE_TO_LOCATION">MOVE_TO_LOCATION</option>
              <option value="RETURN_TO_DOCK">RETURN_TO_DOCK</option>
              <option value="DELIVER_ITEMS">DELIVER_ITEMS</option>
            </select>
          </div>
        </div>

        <div className={needsTarget ? "" : "opacity-50 pointer-events-none"}>
          <label className="text-xs font-bold tracking-widest text-slate-500">TARGET LOCATION</label>
          <div className="mt-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <select
              value={targetLocation}
              onChange={(e) => setTargetLocation(e.target.value)}
              className="w-full bg-transparent text-sm font-semibold text-slate-900 outline-none"
            >
              {LOCATIONS.filter((x) => x !== "DOCK").map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Used for MOVE_TO_LOCATION and DELIVER_ITEMS.
          </p>
        </div>

        <div>
          <label className="text-xs font-bold tracking-widest text-slate-500">DESCRIPTION</label>
          <div className="mt-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional note (e.g., bring meds to living room)"
              className="w-full bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400"
            />
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Optional context saved with the command.
          </p>
        </div>

        <div className="sm:col-span-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm">
            {err ? <span className="font-semibold text-rose-700">{err}</span> : null}
            {msg ? <span className="font-semibold text-emerald-700">{msg}</span> : null}
          </div>

          <button
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 via-cyan-500 to-indigo-500 px-5 py-2.5 text-sm font-extrabold text-white shadow-sm transition hover:brightness-110 disabled:opacity-60"
          >
            <Send className="h-4 w-4" />
            {loading ? "Sending..." : "Send command"}
          </button>
        </div>
      </form>
    </div>
  );
}
