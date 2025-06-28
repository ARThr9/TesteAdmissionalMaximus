import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "../supabaseClient";
import styles from "./Produtos.module.css"; // Importa o arquivo CSS Module
import {
  PlusCircle,
  Edit,
  Trash2,
  FileText,
  File,
  XCircle,
  Save,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { exportToExcel, exportToPDF } from "../utils/exportUtils";

export default function Produtos() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("nome");
  const [sortOrder, setSortOrder] = useState("asc");

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("produtos")
        .select("*")
        .eq("ativo", true)
        .order(sortBy, { ascending: sortOrder === "asc" });

      if (error) throw error;
      setProducts(data);
    } catch (error) {
      alert("Erro ao carregar produtos: " + error.message);
    } finally {
      setLoading(false);
    }
  }, [sortBy, sortOrder]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const addProduct = async (product) => {
    try {
      const { nome, preco, estoque } = product;
      await supabase.from("produtos").insert([{ nome, preco, estoque }]);
      await fetchProducts();
      setIsModalOpen(false);
    } catch (error) {
      alert("Erro ao adicionar produto: " + error.message);
    }
  };

  const updateProduct = async (updatedProduct) => {
    try {
      const { id, nome, preco, estoque } = updatedProduct;
      await supabase
        .from("produtos")
        .update({ nome, preco, estoque })
        .eq("id", id);
      await fetchProducts();
      setIsModalOpen(false);
      setCurrentProduct(null);
    } catch (error) {
      alert("Erro ao atualizar produto: " + error.message);
    }
  };

  const deleteProduct = async (id) => {
    if (
      window.confirm(
        "Tem certeza que deseja desativar este produto? Ele não aparecerá mais para novos pedidos."
      )
    ) {
      try {
        await supabase.from("produtos").update({ ativo: false }).eq("id", id);
        await fetchProducts();
      } catch (error) {
        alert("Erro ao desativar produto: " + error.message);
      }
    }
  };

  const openAddModal = () => {
    setCurrentProduct(null);
    setIsModalOpen(true);
  };

  const openEditModal = (product) => {
    setCurrentProduct(product);
    setIsModalOpen(true);
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  const filteredAndSortedProducts = products.filter(
    (product) =>
      (product.nome &&
        product.nome.toLowerCase().includes(searchTerm.toLowerCase())) ||
      String(product.preco).includes(searchTerm) ||
      String(product.estoque).includes(searchTerm)
  );

  const handleExportExcel = () => {
    exportToExcel(filteredAndSortedProducts, "produtos", [
      "id",
      "nome",
      "preco",
      "estoque",
    ]);
  };

  const handleExportPDF = () => {
    const headers = [["ID", "Nome", "Preço Unitário", "Estoque"]];
    const data = filteredAndSortedProducts.map((prod) => [
      prod.id,
      prod.nome,
      prod.preco,
      prod.estoque,
    ]);
    exportToPDF(headers, data, "produtos");
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <p>Carregando produtos...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h2>Gestão de Produtos</h2>
      <div className={styles.controls}>
        <input
          type="text"
          placeholder="Buscar produto..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.searchInput}
        />
        <button onClick={openAddModal} className={styles.addButton}>
          <PlusCircle size={18} /> Adicionar Produto
        </button>
        <button onClick={handleExportExcel} className={styles.exportButton}>
          <FileText size={18} /> Exportar Excel
        </button>
        <button onClick={handleExportPDF} className={styles.exportButton}>
          <File size={18} /> Exportar PDF
        </button>
      </div>
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th} onClick={() => handleSort("nome")}>
                <div className={styles.sortableHeaderContent}>
                  Nome{" "}
                  {sortBy === "nome" &&
                    (sortOrder === "asc" ? (
                      <ChevronUp size={14} />
                    ) : (
                      <ChevronDown size={14} />
                    ))}
                </div>
              </th>
              <th className={styles.th} onClick={() => handleSort("preco")}>
                <div className={styles.sortableHeaderContent}>
                  Preço Unitário{" "}
                  {sortBy === "preco" &&
                    (sortOrder === "asc" ? (
                      <ChevronUp size={14} />
                    ) : (
                      <ChevronDown size={14} />
                    ))}
                </div>
              </th>
              <th className={styles.th} onClick={() => handleSort("estoque")}>
                <div className={styles.sortableHeaderContent}>
                  Estoque{" "}
                  {sortBy === "estoque" &&
                    (sortOrder === "asc" ? (
                      <ChevronUp size={14} />
                    ) : (
                      <ChevronDown size={14} />
                    ))}
                </div>
              </th>
              <th className={styles.th}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedProducts.length === 0 ? (
              <tr>
                <td
                  colSpan="4"
                  style={{ textAlign: "center", padding: "20px" }}
                >
                  Nenhum produto encontrado.
                </td>
              </tr>
            ) : (
              filteredAndSortedProducts.map((product) => (
                <tr key={product.id}>
                  <td className={styles.td}>{product.nome}</td>
                  <td className={styles.td}>
                    R$ {Number(product.preco).toFixed(2)}
                  </td>
                  <td className={styles.td}>{product.estoque}</td>
                  <td className={styles.tdActions}>
                    <button
                      onClick={() => openEditModal(product)}
                      className={styles.actionButton}
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => deleteProduct(product.id)}
                      className={`${styles.actionButton} ${styles.deleteButton}`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {isModalOpen && (
        <ProductFormModal
          product={currentProduct}
          onSave={currentProduct ? updateProduct : addProduct}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
}

function ProductFormModal({ product, onSave, onClose }) {
  const [formData, setFormData] = useState(
    product || { nome: "", preco: "", estoque: "" }
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === "preco" || name === "estoque" ? Number(value) : value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.nome || !formData.preco || !formData.estoque) {
      alert("Por favor, preencha todos os campos.");
      return;
    }
    onSave(formData);
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <h3>{product ? "Editar Produto" : "Adicionar Produto"}</h3>
        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label>Nome:</label>
            <input
              type="text"
              name="nome"
              value={formData.nome}
              onChange={handleChange}
              className={styles.inputField}
            />
          </div>
          <div className={styles.formGroup}>
            <label>Preço Unitário:</label>
            <input
              type="number"
              name="preco"
              value={formData.preco}
              onChange={handleChange}
              step="0.01"
              className={styles.inputField}
            />
          </div>
          <div className={styles.formGroup}>
            <label>Estoque:</label>
            <input
              type="number"
              name="estoque"
              value={formData.estoque}
              onChange={handleChange}
              className={styles.inputField}
            />
          </div>
          <div className={styles.modalActions}>
            <button
              type="submit"
              className={`${styles.addButton} ${styles.modalSaveButton}`}
            >
              <Save size={18} /> {product ? "Salvar Edição" : "Adicionar"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className={`${styles.exportButton} ${styles.modalCancelButton}`}
            >
              <XCircle size={18} /> Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
