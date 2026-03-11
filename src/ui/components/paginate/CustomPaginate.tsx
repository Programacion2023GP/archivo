import React, { useState, useEffect } from "react";
import { FiSearch, FiX } from "react-icons/fi";
import { MdOutlineKeyboardArrowLeft, MdOutlineKeyboardArrowRight } from "react-icons/md";

type PaginationControlledProps<T> = {
  data: T[];
  itemsPerPage?: number;
  direction?: "row" | "col";
  animationDirection?: "vertical" | "horizontal";
  loading?: boolean;
  renderItem: (item: T, index: number) => React.ReactNode;
  searchFields?: (keyof T)[];
  onPageChange?: (info: {
    currentPage: number;
    totalPages: number;
    from: number;
    to: number;
    currentItems: T[];
  }) => void;
};

export function CustomPaginate<T>({
  data,
  itemsPerPage = 5,
  direction = "col",
  animationDirection = "horizontal",
  loading = false,
  renderItem,
  searchFields = [],
  onPageChange,
}: PaginationControlledProps<T>) {
  const [currentPage, setCurrentPage] = useState(1);
  const [displayItems, setDisplayItems] = useState<T[]>([]);
  const [animating, setAnimating] = useState(false);
  const [search, setSearch] = useState("");
  const [filteredData, setFilteredData] = useState<T[]>(data);

  // Filtrado por buscador
  useEffect(() => {
    if (!search) {
      setFilteredData(data);
      setCurrentPage(1);
      return;
    }

    const filtered = data.filter(item =>
      searchFields.some(field => {
        const value = item[field];
        return value
          ? String(value).toLowerCase().includes(search.toLowerCase())
          : false;
      })
    );

    setFilteredData(filtered);
    setCurrentPage(1);
  }, [search, data]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const updatePage = (page: number) => {
    if (page === currentPage) return;

    setAnimating(true);
    setTimeout(() => {
      const start = (page - 1) * itemsPerPage;
      const end = Math.min(start + itemsPerPage, filteredData.length);
      setDisplayItems(filteredData.slice(start, end));
      setCurrentPage(page);
      setAnimating(false);

      onPageChange &&
        onPageChange({
          currentPage: page,
          totalPages,
          from: start + 1,
          to: end,
          currentItems: filteredData.slice(start, end),
        });
    }, 200);
  };

  useEffect(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = Math.min(start + itemsPerPage, filteredData.length);
    setDisplayItems(filteredData.slice(start, end));

    onPageChange &&
      onPageChange({
        currentPage,
        totalPages,
        from: start + 1,
        to: end,
        currentItems: filteredData.slice(start, end),
      });
  }, [filteredData, currentPage]);

  const getVisiblePages = () => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages: (number | "...")[] = [];
    if (currentPage > 2) pages.push(1);
    if (currentPage > 3) pages.push("...");
    const startPage = Math.max(currentPage - 1, 1);
    const endPage = Math.min(currentPage + 1, totalPages);
    for (let i = startPage; i <= endPage; i++) pages.push(i);
    if (currentPage < totalPages - 2) pages.push("...");
    if (currentPage < totalPages - 1) pages.push(totalPages);
    return pages;
  };

  const isLoading = loading || animating;

  return (
    <div className="flex flex-col gap-4 relative w-full  ">
      {/* Buscador */}
      <div className="flex bg-gray-50  items-center  w-full border border-gray-300 rounded-lg px-3 py-1 shadow-sm focus-within:ring-1 focus-within:ring-cyan-400">
        <FiSearch className="text-gray-400 mr-2" />
        <input
          type="text"
          placeholder="Buscador general..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full outline-none text-sm"
        />
        {search && <FiX className="text-gray-400 cursor-pointer" onClick={() => setSearch("")} />}
      </div>
      {/* <input
        type="text"
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Buscar..."
        className="border p-2 rounded-md w-full"
      /> */}

      {/* Contenido paginado */}
      <div
        className={`grid gap-2 w-full  ${direction === "row"
            ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
            : "grid-flow-row"
          }`}
      >
        {displayItems.map((item, i) => (
          <div
            key={i}
            className={`transition-all duration-300 ease-in-out transform ${animating
                ? animationDirection === "vertical"
                  ? "opacity-0 translate-y-4"
                  : "opacity-0 translate-x-4"
                : "opacity-100 translate-y-0 translate-x-0"
              }`}
          >
            {renderItem(item, i)}
          </div>
        ))}
      </div>

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-70 z-10">
          <div className="w-8 h-8 border-4 border-blue-500 border-dashed rounded-full animate-spin"></div>
        </div>
      )}

      <div className="text-gray-600 text-sm text-center">
        {filteredData.length > 0 &&
          `Mostrando ${(currentPage - 1) * itemsPerPage + 1} - ${Math.min(
            currentPage * itemsPerPage,
            filteredData.length
          )} de ${filteredData.length}`}
      </div>

      <div className="flex justify-center gap-2 mt-2 flex-wrap">
        <button
          onClick={() => updatePage(Math.max(currentPage - 1, 1))}
          className="p-2 rounded-full border border-gray-300 hover:bg-gray-100 transition transform cursor-pointer"
        >
          <MdOutlineKeyboardArrowLeft size={20} />
        </button>

        {getVisiblePages().map((p, i) =>
          p === "..." ? (
            <span key={i} className="px-2 py-1 text-gray-400 text-sm">
              ...
            </span>
          ) : (
            <button
              key={i}
              onClick={() => updatePage(p as number)}
              className={`px-3 py-1 rounded-full border text-sm transition transform cursor-pointer ${currentPage === p
                  ? "bg-blue-500 border-blue-500 text-white scale-105 shadow"
                  : "border-gray-300 hover:bg-gray-100 hover:scale-105"
                }`}
            >
              {p}
            </button>
          )
        )}

        <button
          onClick={() => updatePage(Math.min(currentPage + 1, totalPages))}
          className="p-2 rounded-full border border-gray-300 hover:bg-gray-100 transition transform cursor-pointer"
        >
          <MdOutlineKeyboardArrowRight size={20} />
        </button>
      </div>
    </div>
  );
}
