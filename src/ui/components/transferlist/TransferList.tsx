import React, { useState, useCallback, useMemo, useEffect } from "react";
import { useField, useFormikContext } from "formik";

/* ─── ICONS (inline SVG to avoid import deps) ─── */
const IconCheck = ({ size = 16, className = "" }) => (
   <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
   >
      <polyline points="20 6 9 17 4 12" />
   </svg>
);
const IconMinus = ({ size = 16 }) => (
   <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
      <line x1="5" y1="12" x2="19" y2="12" />
   </svg>
);
const IconChevronRight = ({ size = 14 }) => (
   <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
   </svg>
);
const IconChevronDown = ({ size = 14 }) => (
   <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
   </svg>
);
const IconArrowRight = ({ size = 18 }) => (
   <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
   </svg>
);
const IconArrowLeft = ({ size = 18 }) => (
   <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
   </svg>
);
const IconArrowRightAll = ({ size = 18 }) => (
   <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <line x1="2" y1="12" x2="13" y2="12" />
      <polyline points="9 5 16 12 9 19" />
      <polyline points="14 5 21 12 14 19" />
   </svg>
);
const IconArrowLeftAll = ({ size = 18 }) => (
   <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="12" x2="11" y2="12" />
      <polyline points="15 19 8 12 15 5" />
      <polyline points="10 19 3 12 10 5" />
   </svg>
);
const IconSearch = ({ size = 14 }) => (
   <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
   </svg>
);
const IconX = ({ size = 12 }) => (
   <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
   </svg>
);
const IconLeaf = ({ size = 12 }) => (
   <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z" />
      <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
   </svg>
);

/* ─── TYPES ─── */
export interface TransferListProps<T extends Record<string, any>> {
   name: string;
   label?: string;
   error?: string;
   departamentos: T[];
   idKey: keyof T;
   labelKey: keyof T;
   disabled?: boolean;
   maxHeight?: number;
   groupByPrefix?: boolean;
}

/** Nodo del árbol recursivo */
interface TreeNode<T> {
   id: string; // path completo: "catalogos", "catalogos.dep", etc.
   segment: string; // solo este nivel: "catalogos", "dep", "ver"
   children: Map<string, TreeNode<T>>;
   leaves: T[]; // items que terminan exactamente en este nodo
   allLeafIds: number[]; // todos los ids de hojas bajo este nodo (recursivo)
}

/* ─── BUILD RECURSIVE TREE ─── */
function buildTree<T extends Record<string, any>>(items: T[], idKey: keyof T, labelKey: keyof T): TreeNode<T> {
   const root: TreeNode<T> = {
      id: "__root__",
      segment: "__root__",
      children: new Map(),
      leaves: [],
      allLeafIds: []
   };

   for (const item of items) {
      const label = String(item[labelKey]);
      const parts = label.split("_");
      let node = root;

      for (let i = 0; i < parts.length; i++) {
         const seg = parts[i];
         const pathId = parts.slice(0, i + 1).join(".");
         const isLast = i === parts.length - 1;

         if (!node.children.has(seg)) {
            node.children.set(seg, {
               id: pathId,
               segment: seg,
               children: new Map(),
               leaves: [],
               allLeafIds: []
            });
         }
         node = node.children.get(seg)!;

         if (isLast) {
            node.leaves.push(item);
         }
      }
   }

   // Fill allLeafIds recursively
   const fillLeafIds = (node: TreeNode<T>): number[] => {
      const ids: number[] = [...node.leaves.map((l) => Number(l[idKey])), ...[...node.children.values()].flatMap((c) => fillLeafIds(c))];
      node.allLeafIds = ids;
      return ids;
   };
   fillLeafIds(root);

   return root;
}

/* ─── DESIGN TOKENS ─── */
const T = {
   bg: "#ffffff",
   surface: "#f8f8fc",
   border: "#e6e6ee",
   borderFocus: "#6366f1",
   text1: "#1e1b4b",
   text2: "#6b7280",
   text3: "#9ca3af",
   accent: "#6366f1",
   accentLight: "rgba(99,102,241,0.10)",
   accentMid: "rgba(99,102,241,0.20)",
   checked: "#6366f1",
   checkedBg: "rgba(99,102,241,0.08)",
   partial: "#a78bfa",
   partialBg: "rgba(167,139,250,0.10)",
   hover: "#f5f5ff",
   shadow: "0 1px 3px rgba(0,0,0,0.07), 0 4px 16px rgba(0,0,0,0.05)",
   shadowMd: "0 4px 24px rgba(0,0,0,0.10)",
   r4: "5px",
   r6: "9px",
   r8: "13px",
   r12: "18px",
   leafColor: ["#6366f1", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#3b82f6"]
};

/* ─── DEPTH COLOR ─── */
const depthColor = (depth: number) => T.leafColor[depth % T.leafColor.length];

/* ─── CHECKBOX COMPONENT ─── */
const TreeCheckbox = ({
   state,
   onClick,
   disabled,
   color = T.accent
}: {
   state: "none" | "partial" | "all";
   onClick: (e: React.MouseEvent) => void;
   disabled?: boolean;
   color?: string;
}) => {
   const bg = state === "all" ? color : state === "partial" ? "white" : "white";
   const border = state === "all" ? color : state === "partial" ? color : "#d1d5db";

   return (
      <button
         type="button"
         onClick={onClick}
         disabled={disabled}
         style={{
            width: 18,
            height: 18,
            borderRadius: 5,
            background: bg,
            border: `2px solid ${border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: disabled ? "not-allowed" : "pointer",
            flexShrink: 0,
            transition: "all 0.15s",
            opacity: disabled ? 0.4 : 1
         }}
      >
         {state === "all" && <IconCheck size={11} className="" />}
         {state === "partial" && <div style={{ width: 8, height: 2, background: color, borderRadius: 1 }} />}
      </button>
   );
};

/* ─── RECURSIVE TREE NODE RENDER ─── */
const TreeNodeRow = <T extends Record<string, any>>({
   node,
   depth,
   checkedItems,
   onToggleIds,
   disabled,
   idKey,
   labelKey,
   expandedNodes,
   onToggleExpand,
   isSearch = false
}: {
   node: TreeNode<T>;
   depth: number;
   checkedItems: number[];
   onToggleIds: (ids: number[], forceValue?: boolean) => void;
   disabled?: boolean;
   idKey: keyof T;
   labelKey: keyof T;
   expandedNodes: Set<string>;
   onToggleExpand: (id: string) => void;
   isSearch?: boolean;
}) => {
   const isExpanded = expandedNodes.has(node.id);
   const hasChildren = node.children.size > 0;
   const hasLeaves = node.leaves.length > 0;
   const color = depthColor(depth);

   // Check state
   const allIds = node.allLeafIds;
   const checkedCount = allIds.filter((id) => checkedItems.includes(id)).length;
   const checkState: "none" | "partial" | "all" = checkedCount === 0 ? "none" : checkedCount === allIds.length ? "all" : "partial";

   const handleCheckbox = (e: React.MouseEvent) => {
      e.stopPropagation();
      const shouldSelect = checkState !== "all";
      onToggleIds(allIds, shouldSelect);
   };

   const indent = depth * 16;

   return (
      <div>
         {/* NODE HEADER */}
         <div
            onClick={() => (hasChildren || hasLeaves) && onToggleExpand(node.id)}
            style={{
               display: "flex",
               alignItems: "center",
               gap: 6,
               padding: `6px 10px 6px ${10 + indent}px`,
               cursor: hasChildren ? "pointer" : "default",
               borderRadius: T.r6,
               background: checkState !== "none" ? T.checkedBg : "transparent",
               transition: "background 0.12s",
               userSelect: "none"
            }}
            onMouseEnter={(e) => {
               if (checkState === "none") (e.currentTarget as HTMLDivElement).style.background = T.hover;
            }}
            onMouseLeave={(e) => {
               if (checkState === "none") (e.currentTarget as HTMLDivElement).style.background = "transparent";
            }}
         >
            {/* EXPAND ICON */}
            <div style={{ width: 16, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", color: T.text3 }}>
               {hasChildren ? (
                  isExpanded ? (
                     <IconChevronDown size={13} />
                  ) : (
                     <IconChevronRight size={13} />
                  )
               ) : (
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: color, display: "block", margin: "auto" }} />
               )}
            </div>

            {/* CHECKBOX */}
            <TreeCheckbox state={checkState} onClick={handleCheckbox} disabled={disabled} color={color} />

            {/* LABEL */}
            <span
               style={{
                  fontSize: 12.5,
                  fontWeight: hasChildren ? 700 : 500,
                  color: hasChildren ? T.text1 : T.text2,
                  flex: 1,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap"
               }}
            >
               {node.segment}
            </span>

            {/* COUNT BADGE */}
            {allIds.length > 0 && (
               <span
                  style={{
                     fontSize: 10,
                     fontWeight: 700,
                     color: checkState !== "none" ? color : T.text3,
                     background: checkState !== "none" ? `${color}18` : T.surface,
                     borderRadius: 100,
                     padding: "1px 6px",
                     flexShrink: 0,
                     border: `1px solid ${checkState !== "none" ? `${color}30` : T.border}`
                  }}
               >
                  {checkedCount > 0 ? `${checkedCount}/` : ""}
                  {allIds.length}
               </span>
            )}
         </div>

         {/* CHILDREN */}
         {isExpanded && (
            <div
               style={{
                  borderLeft: `2px solid ${color}25`,
                  marginLeft: 18 + indent,
                  marginBottom: 2
               }}
            >
               {/* Sub-groups */}
               {[...node.children.values()].map((child) => (
                  <TreeNodeRow
                     key={child.id}
                     node={child}
                     depth={depth + 1}
                     checkedItems={checkedItems}
                     onToggleIds={onToggleIds}
                     disabled={disabled}
                     idKey={idKey}
                     labelKey={labelKey}
                     expandedNodes={expandedNodes}
                     onToggleExpand={onToggleExpand}
                  />
               ))}

               {/* Leaves at this level */}
               {node.leaves.map((item) => {
                  const id = Number(item[idKey]);
                  const labelText = String(item[labelKey]);
                  const isChecked = checkedItems.includes(id);
                  const leafColor = depthColor(depth + 1);

                  return (
                     <div
                        key={id}
                        onClick={() => onToggleIds([id])}
                        style={{
                           display: "flex",
                           alignItems: "center",
                           gap: 8,
                           padding: "5px 10px",
                           borderRadius: T.r4,
                           background: isChecked ? T.checkedBg : "transparent",
                           cursor: disabled ? "not-allowed" : "pointer",
                           opacity: disabled ? 0.5 : 1,
                           transition: "background 0.12s"
                        }}
                        onMouseEnter={(e) => {
                           if (!isChecked) (e.currentTarget as HTMLDivElement).style.background = T.hover;
                        }}
                        onMouseLeave={(e) => {
                           if (!isChecked) (e.currentTarget as HTMLDivElement).style.background = "transparent";
                        }}
                     >
                        <IconLeaf size={12} />
                        <TreeCheckbox
                           state={isChecked ? "all" : "none"}
                           onClick={(e) => {
                              e.stopPropagation();
                              onToggleIds([id]);
                           }}
                           disabled={disabled}
                           color={leafColor}
                        />
                        <span
                           style={{
                              fontSize: 12,
                              color: isChecked ? leafColor : T.text2,
                              flex: 1,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap"
                           }}
                        >
                           {labelText}
                        </span>
                     </div>
                  );
               })}
            </div>
         )}
      </div>
   );
};

/* ─── FLAT SEARCH RESULTS ─── */
const FlatSearchRow = <T extends Record<string, any>>({
   item,
   idKey,
   labelKey,
   checkedItems,
   onToggle,
   disabled
}: {
   item: T;
   idKey: keyof T;
   labelKey: keyof T;
   checkedItems: number[];
   onToggle: (id: number) => void;
   disabled?: boolean;
}) => {
   const id = Number(item[idKey]);
   const label = String(item[labelKey]);
   const isChecked = checkedItems.includes(id);

   return (
      <div
         onClick={() => !disabled && onToggle(id)}
         style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "6px 10px",
            borderRadius: T.r6,
            cursor: disabled ? "not-allowed" : "pointer",
            background: isChecked ? T.checkedBg : "transparent",
            transition: "background 0.12s",
            opacity: disabled ? 0.5 : 1
         }}
         onMouseEnter={(e) => {
            if (!isChecked) (e.currentTarget as HTMLDivElement).style.background = T.hover;
         }}
         onMouseLeave={(e) => {
            if (!isChecked) (e.currentTarget as HTMLDivElement).style.background = "transparent";
         }}
      >
         <TreeCheckbox
            state={isChecked ? "all" : "none"}
            onClick={(e) => {
               e.stopPropagation();
               onToggle(id);
            }}
            disabled={disabled}
         />
         <span style={{ fontSize: 12.5, color: isChecked ? T.accent : T.text2, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {label.split("_").join(" › ")}
         </span>
      </div>
   );
};

/* ─── TRANSFER PANEL ─── */
const TransferPanel = <T extends Record<string, any>>({
   title,
   count,
   items,
   treeRoot,
   checkedItems,
   onToggleIds,
   searchValue,
   onSearchChange,
   emptyMessage,
   disabled,
   idKey,
   labelKey,
   maxHeight
}: {
   title: string;
   count: number;
   items: T[];
   treeRoot: TreeNode<T>;
   checkedItems: number[];
   onToggleIds: (ids: number[], forceValue?: boolean) => void;
   searchValue: string;
   onSearchChange: (v: string) => void;
   emptyMessage: string;
   disabled?: boolean;
   idKey: keyof T;
   labelKey: keyof T;
   maxHeight: number;
}) => {
   const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

   const toggleExpand = useCallback((id: string) => {
      setExpandedNodes((prev) => {
         const n = new Set(prev);
         n.has(id) ? n.delete(id) : n.add(id);
         return n;
      });
   }, []);

   const handleToggleSingle = useCallback(
      (id: number) => {
         onToggleIds([id]);
      },
      [onToggleIds]
   );

   // Check state for "select all visible"
   const allVisibleIds = items.map((i) => Number(i[idKey]));
   const checkedVisible = allVisibleIds.filter((id) => checkedItems.includes(id));
   const allState: "none" | "partial" | "all" = checkedVisible.length === 0 ? "none" : checkedVisible.length === allVisibleIds.length ? "all" : "partial";

   return (
      <div
         style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            background: T.bg,
            border: `1.5px solid ${T.border}`,
            borderRadius: T.r12,
            overflow: "hidden",
            boxShadow: T.shadow,
            minWidth: 0
         }}
      >
         {/* HEADER */}
         <div
            style={{
               padding: "12px 14px 10px",
               background: T.surface,
               borderBottom: `1px solid ${T.border}`,
               display: "flex",
               alignItems: "center",
               gap: 8
            }}
         >
            <TreeCheckbox
               state={allState}
               onClick={(e) => {
                  e.stopPropagation();
                  onToggleIds(allVisibleIds, allState !== "all");
               }}
               disabled={disabled || items.length === 0}
            />
            <span style={{ fontSize: 13, fontWeight: 800, color: T.text1, flex: 1 }}>{title}</span>
            <span
               style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: T.accent,
                  background: T.accentLight,
                  borderRadius: 100,
                  padding: "2px 8px"
               }}
            >
               {checkedVisible.length > 0 ? `${checkedVisible.length}/` : ""}
               {count}
            </span>
         </div>

         {/* SEARCH */}
         <div
            style={{
               padding: "10px 12px 8px",
               borderBottom: `1px solid ${T.border}`,
               background: T.bg
            }}
         >
            <div
               style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  background: T.surface,
                  border: `1.5px solid ${T.border}`,
                  borderRadius: T.r6,
                  padding: "6px 10px",
                  transition: "border-color 0.15s"
               }}
               onFocus={() => {}}
            >
               <IconSearch size={13} />
               <input
                  type="text"
                  placeholder="Buscar permiso…"
                  value={searchValue}
                  onChange={(e) => onSearchChange(e.target.value)}
                  disabled={disabled}
                  style={{
                     background: "none",
                     border: "none",
                     outline: "none",
                     fontSize: 12.5,
                     color: T.text1,
                     flex: 1,
                     fontFamily: "inherit"
                  }}
               />
               {searchValue && (
                  <button
                     onClick={() => onSearchChange("")}
                     style={{ background: "none", border: "none", cursor: "pointer", color: T.text3, display: "flex", padding: 0 }}
                  >
                     <IconX size={12} />
                  </button>
               )}
            </div>
         </div>

         {/* TREE / FLAT LIST */}
         <div style={{ overflowY: "auto", maxHeight, padding: "6px 6px" }}>
            {items.length === 0 ? (
               <div style={{ padding: "32px 16px", textAlign: "center", color: T.text3, fontSize: 12 }}>{emptyMessage}</div>
            ) : searchValue ? (
               // Flat search results
               items.map((item) => (
                  <FlatSearchRow
                     key={Number(item[idKey])}
                     item={item}
                     idKey={idKey}
                     labelKey={labelKey}
                     checkedItems={checkedItems}
                     onToggle={handleToggleSingle}
                     disabled={disabled}
                  />
               ))
            ) : (
               // Recursive tree
               [...treeRoot.children.values()].map((child) => (
                  <TreeNodeRow
                     key={child.id}
                     node={child}
                     depth={0}
                     checkedItems={checkedItems}
                     onToggleIds={onToggleIds}
                     disabled={disabled}
                     idKey={idKey}
                     labelKey={labelKey}
                     expandedNodes={expandedNodes}
                     onToggleExpand={toggleExpand}
                  />
               ))
            )}
         </div>
      </div>
   );
};

/* ─── CONTROL BUTTON ─── */
const CtrlBtn = ({ onClick, disabled, children, title }: { onClick: () => void; disabled?: boolean; children: React.ReactNode; title?: string }) => (
   <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
         width: 36,
         height: 36,
         borderRadius: "50%",
         background: disabled ? T.surface : T.accent,
         border: `1.5px solid ${disabled ? T.border : T.accent}`,
         color: disabled ? T.text3 : "#fff",
         display: "flex",
         alignItems: "center",
         justifyContent: "center",
         cursor: disabled ? "not-allowed" : "pointer",
         transition: "all 0.15s",
         boxShadow: disabled ? "none" : "0 2px 8px rgba(99,102,241,0.35)",
         opacity: disabled ? 0.5 : 1
      }}
      onMouseEnter={(e) => {
         if (!disabled) (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.08)";
      }}
      onMouseLeave={(e) => {
         (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
      }}
   >
      {children}
   </button>
);

/* ════════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════════ */
export const FTransferList = <T extends Record<string, any>>({
   name,
   label,
   error,
   departamentos,
   idKey,
   labelKey,
   disabled = false,
   maxHeight = 340,
   groupByPrefix = true
}: TransferListProps<T>) => {
   const formik = useFormikContext<any>();
   const [field, meta] = useField<number[]>({ name });

   const [selected, setSelected] = useState<number[]>(field.value || []);
   const [leftChecked, setLeftChecked] = useState<number[]>([]);
   const [rightChecked, setRightChecked] = useState<number[]>([]);
   const [searchLeft, setSearchLeft] = useState("");
   const [searchRight, setSearchRight] = useState("");

   // Sync with Formik
   useEffect(() => {
      if (Array.isArray(field.value) && JSON.stringify(field.value) !== JSON.stringify(selected)) {
         setSelected(field.value);
      }
   }, [field.value]);

   const updateSelected = useCallback(
      (newSelected: number[]) => {
         setSelected(newSelected);
         formik.setFieldValue(name, newSelected);
         formik.setFieldTouched(name, true);
      },
      [formik, name]
   );

   /* ── DERIVED DATA ── */
   const { disponibles, elegidos, treeDisponibles, treeElegidos } = useMemo(() => {
      const allDisponibles = departamentos.filter((d) => !selected.includes(Number(d[idKey])));
      const allElegidos = departamentos.filter((d) => selected.includes(Number(d[idKey])));

      const filterItems = (items: T[], search: string) =>
         search ? items.filter((item) => String(item[labelKey]).toLowerCase().includes(search.toLowerCase())) : items;

      const filteredDisp = filterItems(allDisponibles, searchLeft);
      const filteredEleg = filterItems(allElegidos, searchRight);

      return {
         disponibles: filteredDisp,
         elegidos: filteredEleg,
         treeDisponibles: buildTree(filteredDisp, idKey, labelKey),
         treeElegidos: buildTree(filteredEleg, idKey, labelKey)
      };
   }, [departamentos, selected, idKey, labelKey, searchLeft, searchRight]);

   /* ── TOGGLE IDS (left/right) ── */
   const toggleLeftIds = useCallback((ids: number[], forceValue?: boolean) => {
      setLeftChecked((prev) => {
         if (forceValue === true) return [...new Set([...prev, ...ids])];
         if (forceValue === false) return prev.filter((id) => !ids.includes(id));
         // Toggle individual
         const allIn = ids.every((id) => prev.includes(id));
         return allIn ? prev.filter((id) => !ids.includes(id)) : [...new Set([...prev, ...ids])];
      });
   }, []);

   const toggleRightIds = useCallback((ids: number[], forceValue?: boolean) => {
      setRightChecked((prev) => {
         if (forceValue === true) return [...new Set([...prev, ...ids])];
         if (forceValue === false) return prev.filter((id) => !ids.includes(id));
         const allIn = ids.every((id) => prev.includes(id));
         return allIn ? prev.filter((id) => !ids.includes(id)) : [...new Set([...prev, ...ids])];
      });
   }, []);

   /* ── MOVE OPERATIONS ── */
   const moveRight = useCallback(() => {
      if (!leftChecked.length) return;
      updateSelected([...selected, ...leftChecked]);
      setLeftChecked([]);
   }, [leftChecked, selected, updateSelected]);

   const moveAllRight = useCallback(() => {
      const allDispIds = departamentos.filter((d) => !selected.includes(Number(d[idKey]))).map((d) => Number(d[idKey]));
      if (!allDispIds.length) return;
      updateSelected([...selected, ...allDispIds]);
      setLeftChecked([]);
   }, [departamentos, selected, idKey, updateSelected]);

   const moveLeft = useCallback(() => {
      if (!rightChecked.length) return;
      updateSelected(selected.filter((id) => !rightChecked.includes(id)));
      setRightChecked([]);
   }, [rightChecked, selected, updateSelected]);

   const moveAllLeft = useCallback(() => {
      const elegIds = departamentos.filter((d) => selected.includes(Number(d[idKey]))).map((d) => Number(d[idKey]));
      if (!elegIds.length) return;
      updateSelected(selected.filter((id) => !elegIds.includes(id)));
      setRightChecked([]);
   }, [departamentos, selected, idKey, updateSelected]);

   const hasError = meta.error && (meta.touched || formik.submitCount > 0);

   return (
      <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%", fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }}>
         {label && <label style={{ fontSize: 13, fontWeight: 700, color: T.text1 }}>{label}</label>}

         <div style={{ display: "flex", gap: 12, alignItems: "stretch", width: "100%" }}>
            {/* LEFT PANEL */}
            <TransferPanel
               title="Disponibles"
               count={disponibles.length}
               items={disponibles}
               treeRoot={treeDisponibles}
               checkedItems={leftChecked}
               onToggleIds={toggleLeftIds}
               searchValue={searchLeft}
               onSearchChange={setSearchLeft}
               emptyMessage="No hay permisos disponibles"
               disabled={disabled}
               idKey={idKey}
               labelKey={labelKey}
               maxHeight={maxHeight}
            />

            {/* CONTROLS */}
            <div
               style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  flexShrink: 0,
                  padding: "0 4px"
               }}
            >
               <CtrlBtn onClick={moveRight} disabled={leftChecked.length === 0 || disabled} title="Mover seleccionados →">
                  <IconArrowRight size={16} />
               </CtrlBtn>
               <CtrlBtn onClick={moveAllRight} disabled={disponibles.length === 0 || disabled} title="Mover todos →">
                  <IconArrowRightAll size={16} />
               </CtrlBtn>

               <div style={{ width: 1, height: 20, background: T.border }} />

               <CtrlBtn onClick={moveLeft} disabled={rightChecked.length === 0 || disabled} title="← Remover seleccionados">
                  <IconArrowLeft size={16} />
               </CtrlBtn>
               <CtrlBtn onClick={moveAllLeft} disabled={elegidos.length === 0 || disabled} title="← Remover todos">
                  <IconArrowLeftAll size={16} />
               </CtrlBtn>
            </div>

            {/* RIGHT PANEL */}
            <TransferPanel
               title="Asignados"
               count={elegidos.length}
               items={elegidos}
               treeRoot={treeElegidos}
               checkedItems={rightChecked}
               onToggleIds={toggleRightIds}
               searchValue={searchRight}
               onSearchChange={setSearchRight}
               emptyMessage="No hay permisos asignados"
               disabled={disabled}
               idKey={idKey}
               labelKey={labelKey}
               maxHeight={maxHeight}
            />
         </div>

         {/* FOOTER INFO */}
         <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: T.text3 }}>
            <span>{leftChecked.length > 0 && `${leftChecked.length} marcado${leftChecked.length > 1 ? "s" : ""} en disponibles`}</span>
            <span>{rightChecked.length > 0 && `${rightChecked.length} marcado${rightChecked.length > 1 ? "s" : ""} en asignados`}</span>
         </div>

         {hasError && <span style={{ fontSize: 12, fontWeight: 600, color: "#ef4444" }}>{meta.error as string}</span>}
      </div>
   );
};

export default FTransferList;
