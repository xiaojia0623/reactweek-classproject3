import { useEffect, useState, useRef } from 'react'
import axios from 'axios'
import './assets/all.scss'
import { Modal } from 'bootstrap'

const BASE_URL = import.meta.env.VITE_BASE_URL;
const API_PATH = import.meta.env.VITE_API_PATH;

const defaultmodalMode = {
  imageUrl: "",
  title: "",
  category: "",
  unit: "",
  origin_price: "",
  price: "",
  description: "",
  content: "",
  is_enabled: 0,
  imagesUrl: [""]
};

function App() {

  const [isLogin, setIsLogin] = useState(false);
  
  const [products, setProducts] = useState([]);

  const [myAccount, setMyAccount] = useState({
    username:'email@example.com',
    password:'example'
  })

  const handleInputChange = (e) => {
    const {value, name} = e.target;
    setMyAccount({
      ...myAccount,
      [name]: value
    });
  }

  const getProducts = async () => {
    try{
      const res = await axios.get(`${BASE_URL}/v2/api/${API_PATH}/admin/products`);
      setProducts(res.data.products);
    }catch(error) {
      alert('產品取得失敗!!')
    }
  }

  const handleLogin = async (e) => {
    e.preventDefault();

    try{
      const res = await axios.post(`${BASE_URL}/v2/admin/signin`,myAccount);
      const {token, expired} = res.data;

      //console.log(token, expired);
      document.cookie = `jiafei123456=${token}; expires=${new Date(expired)}`;

      axios.defaults.headers.common['Authorization'] = token;

      getProducts();
      setIsLogin(true);
    }catch(error) {
      alert('登入失敗')
    }
  }

  const loginCheck = async (e) => {
    e.preventDefault();
    try{
        await axios.post(`${BASE_URL}/v2/api/user/check`);
        getProducts();
        setIsLogin(true);
    }catch (error){
      console.error(error)
    }
  }

  useEffect(() => {
    const token = document.cookie.replace(
      /(?:(?:^|.*;\s*)jiafei123456\s*\=\s*([^;]*).*$)|^.*$/,
      "$1",
    );
    axios.defaults.headers.common['Authorization'] = token;

    loginCheck();
  },[])

  const productModalRef = useRef(null);
  const delProductModalRef = useRef(null);
  const [modalMode, setmodalMode] = useState(null);

  useEffect(() => {
    //console.log(productModalRef.current);
    new Modal(productModalRef.current, {
      backdrop: false
    });

    new Modal(delProductModalRef.current, {
      backdrop: false
    });
  }, [])

  const handleOpenProductModal = (mode, product) => {
    setmodalMode(mode);
    
    switch(mode) {
      case 'create':
        setTempProduct(defaultmodalMode);
        break;

      case 'edit':
        setTempProduct(product);
        break;

      default:
        break;
    }
    

    const modalInstance = Modal.getInstance(productModalRef.current);
    modalInstance.show();
  }

  const handleCloseProductModal = () => {
    const modalInstance = Modal.getInstance(productModalRef.current);
    modalInstance.hide();
  }

  const handleOpenDelProductModal = (product) => {
    setTempProduct(product);
    const modalInstance = Modal.getInstance(delProductModalRef.current);
    modalInstance.show();
  }

  const handleCloseDelProductModal = () => {
    const modalInstance = Modal.getInstance(delProductModalRef.current);
    modalInstance.hide();
  }


  const [tempProduct, setTempProduct] = useState(defaultmodalMode);
  

  const handleModalInputChange = (e) => {
    const {value, name, checked, type} = e.target;
    setTempProduct({
      ...tempProduct,
      [name]: type === "checkbox" ? checked : value,
    })
  }

  const handleImageChange = (e, index) => {
    const {value} = e.target;

    const newImages = [...tempProduct.imagesUrl];

    newImages[index] = value;

    setTempProduct({
      ...tempProduct,
      imagesUrl: newImages
    })
  }

  const handleAddImage = () => {
    const newImages = [...tempProduct.imagesUrl, ''];

    setTempProduct({
      ...tempProduct,
      imagesUrl: newImages
    })
  }

  const handleRemoveImage = () => {
    const newImages = [...tempProduct.imagesUrl];

    newImages.pop()

    setTempProduct({
      ...tempProduct,
      imagesUrl: newImages
    })
  }

  const createProduct = async () => {
    try{
      await axios.post(`${BASE_URL}/v2/api/${API_PATH}/admin/product`, {
        data: {
          ...tempProduct,
          origin_price: Number(tempProduct.origin_price),
          price: Number(tempProduct.origin),
          is_enabled: tempProduct.is_enabled ? 1 : 0
        }
      })
    }catch (error) {
      alert('新增產品失敗');
    }
  }

  const updateProduct = async () => {
    try{
      await axios.put(`${BASE_URL}/v2/api/${API_PATH}/admin/product/
        ${tempProduct.id}`, {
        data: {
          ...tempProduct,
          origin_price: Number(tempProduct.origin_price),
          price: Number(tempProduct.origin),
          is_enabled: tempProduct.is_enabled ? 1 : 0
        }
      })
    }catch (error) {
      alert('編輯產品失敗');
    }
  }

  const deleteProduct = async () => {
    try{
      await axios.delete(`${BASE_URL}/v2/api/${API_PATH}/admin/product/
        ${tempProduct.id}`)
    }catch (error) {
      alert('刪除產品失敗');
    }
  }

  const handleDeleteProduct = async () => {
    try{
      await deleteProduct();

      getProducts();

      handleCloseDelProductModal();
    }catch (error) {
      alert('刪除產品失敗')
    }
  }


  const handleUpdateProduct = async () => {

    const apiCall = modalMode === 'create' ? createProduct() : updateProduct();
    
    try{
      await apiCall;

      getProducts();
      handleCloseProductModal();
    }catch (error) {
      alert('更新產品失敗')
    }
  }

  return (
    <>
      {isLogin ? (<p><div className="container mt-5">
          <div className="row">
            
            <div className="col">
              <div className="d-flex justify-content-between">
                <h2 className='fw-bold'>產品列表</h2>
                <button onClick={() => handleOpenProductModal('create')} type="button" className="btn btn-primary mb-3">建立新的產品</button>
              </div>
              <table className="table" >
                <thead>
                  <tr>
                    <th scope="col">產品名稱</th>
                    <th scope="col">原價</th>
                    <th scope="col">售價</th>
                    <th scope="col">是否啟用</th>
                    <th scope="col">編輯或刪除</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id}>
                      <th scope="row">{product.title}</th>
                      <td>$ {product.origin_price}</td>
                      <td>$ {product.price}</td>
                      <td>{product.is_enabled ? (<span className="text-success">啟用</span>) : <span>未啟用</span>}</td>
                      <td>
                        <div className="btn-group">
                          <button onClick={() => handleOpenProductModal('edit', product)} type="button" className="btn btn-outline-primary btn-sm">編輯</button>
                          <button  onClick={() => handleOpenDelProductModal(product)} type="button" className="btn btn-outline-danger btn-sm">刪除</button>
                        </div>
                      </td>
                  </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
      </div></p>) : (<div className='login-page d-flex'>
        <div >
          <h1>請先登入</h1>
          <form onSubmit={(e) => handleLogin(e)}>
            <div className="form-floating mb-3">
              <input name='username' value={myAccount.username} onChange={handleInputChange} type="email" className="form-control" id="floatingInput" placeholder="name@example.com" />
              <label htmlFor="floatingInput">Email address</label>
            </div>
            <div className="form-floating mb-3">
              <input name='password' value={myAccount.password} onChange={handleInputChange} type="password" className="form-control" id="floatingPassword" placeholder="Password" />
              <label htmlFor="floatingPassword">Password</label>
            </div>
            <button className="btn btn-primary w-100">登入</button>
          </form>
        </div>

        <div>
          <img src="https://media.istockphoto.com/id/1016968886/photo/business-technology-internet-and-networking-concept.webp?a=1&b=1&s=612x612&w=0&k=20&c=5Xf4t-rZX7_H9JWF8jrHN2C0tVJ9zgOeZ5R2TxSZ-oQ=" alt="" />
        </div>
      </div>)}


      <div ref={productModalRef} className='modal' id='productsModal' style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
        <div className="modal-dialog modal-dialog-centered modal-xl">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">{modalMode === 'create' ? '新增產品' : '編輯產品'}</h5>
              <button type='button' onClick={handleCloseProductModal} className="btn-close" aria-label='Close'></button>
            </div>

            <div className="modal-body">
              <div className="row">
                <div className="col-md-4">
                  <div className="mb-3">
                    <label htmlFor="" className="form-label">主圖</label>
                    <div className="input-group mb-2">
                      <input value={tempProduct.imageUrl} onChange={handleModalInputChange} type="text" name="imageUrl" id='primary-image' className="form-control" placeholder='請輸入圖片連結'/>
                    </div>
                    <img src={tempProduct.imageUrl} alt={tempProduct.title} className="img-fluid" />
                  </div>

                  {/* 副圖 */}
                  <div className='p-3'>
                    {tempProduct.imagesUrl?.map((image, index) => (
                      <div key={index} className="mb-2">
                        <label htmlFor={`imagesUrl-${index + 1}`} className="form-label">副圖 {index + 1}</label>
                        <input value={image} onChange={(e) => {handleImageChange(e, index)}} id={`imagesUrl-${index + 1}`} type="text" className="form-control mb-2" placeholder={`圖片網址 ${index + 1}`}/>
                        {image && (
                          <img src={image} alt={`副圖 ${index + 1}`} className="img-fluid mb-3" />
                        )}
                      </div>
                    ))}

                    <div className="btn-group w-100">
                      {tempProduct.imagesUrl.length < 5 && 
                      tempProduct.imagesUrl[tempProduct.imagesUrl.length - 1] !== "" && (
                        <button onClick={handleAddImage} className="btn btn-outline-primary btn-sm w-100">新增圖片</button>
                      )}


                      {tempProduct.imagesUrl.length > 1 && (<button onClick={handleRemoveImage} className="btn btn-outline-danger btn-sm w-100">取消圖片</button>)}
                    </div>
                    

                  </div>

                </div>

                <div className="col-md-8">
                  <div className="mb-3">
                    <label htmlFor="title" className="form-label">標題</label>
                    <input value={tempProduct.title} onChange={handleModalInputChange} name='title' type="text" className="form-control" id="title" placeholder='請輸入標題'/>
                  </div>

                  <div className="mb-3">
                    <label htmlFor="category" className="form-label">分類</label>
                    <input value={tempProduct.category} onChange={handleModalInputChange} name='category' type="text" className="form-control" id="category" placeholder='請輸入分類'/>
                  </div>

                  <div className="mb-3">
                    <label htmlFor="unit" className="form-label">單位</label>
                    <input value={tempProduct.unit} onChange={handleModalInputChange} name='unit' type="text" className="form-control" id="unit" placeholder='請輸入單位'/>
                  </div>

                  <div className="row mb-3">
                    <div className="col-6">
                      <label htmlFor="origin_price" className="form-label">原價</label>
                      <input value={tempProduct.origin_price} onChange={handleModalInputChange} name='origin_price' type="number" className="form-control" id="origin_price" placeholder='請輸入原價'/>
                    </div>

                    <div className="col-6">
                      <label htmlFor="price" className="form-label">售價</label>
                      <input value={tempProduct.price} onChange={handleModalInputChange} name='price' type="number" className="form-control" id="price" placeholder='請輸入售價'/>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label htmlFor="description" className="form-label">產品描述</label>
                    <textarea value={tempProduct.description} onChange={handleModalInputChange} row={10} cols={30} name="description" id="description" className="form-control" placeholder='請輸入產品描述'></textarea>
                  </div>

                  <div className="mb-3 d-flex flex-column">
                    <label htmlFor="content" className="form-label">說明內容</label>
                    <textarea value={tempProduct.content} onChange={handleModalInputChange} row={10} cols={30}  name="content" id="content" className='form-ocntrol' placeholder='請輸入說明內容'></textarea>
                  </div>

                  <div className="form-check">
                    <input checked={tempProduct.is_enabled} onChange={handleModalInputChange} name='is_enabled' type="checkbox" className="form-check-input" id="isEnabled" />
                    <label htmlFor="isEnabled" className="form-check-label">是否啟用</label>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button onClick={handleCloseProductModal} type='button' className="btn btn-secondary">取消</button>
              <button onClick={handleUpdateProduct} type='button' className="btn btn-primary">確認</button>
            </div>
          </div>
        </div>
      </div>
      

      <div ref={delProductModalRef} className="modal fade" id="delProductModal" tabIndex="-1"
        style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      >
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h1 className="modal-title fs-5">刪除產品</h1>
              <button
                onClick={handleCloseDelProductModal}
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              ></button>
            </div>
            <div className="modal-body">
              你是否要刪除 
              <span className="text-danger fw-bold">{tempProduct.title}</span>
            </div>
            <div className="modal-footer">
              <button
                onClick={handleCloseDelProductModal}
                type="button"
                className="btn btn-secondary"
              >
                取消
              </button>
              <button onClick={handleDeleteProduct} type="button" className="btn btn-danger">
                刪除
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default App

