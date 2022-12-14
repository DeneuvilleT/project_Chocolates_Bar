import { faClockRotateLeft, faCartFlatbedSuitcase, faShieldHeart, faCartArrowDown, faSadTear } from '@fortawesome/free-solid-svg-icons';
import { removeToCart, lessQuantity, addQuantity, clearCart, priceTotal } from '../../slices/cartSlices';
import { faMinusSquare, faPlusSquare, faTrashCan } from '@fortawesome/free-regular-svg-icons';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { notification, stripePromise } from '../../utilities';
import { useSelector, useDispatch } from 'react-redux';
import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Elements } from '@stripe/react-stripe-js';
import { sendPay } from '../../api/cart';

import Checkout from '../CheckOut/CheckOut';
import styles from './cart.module.css';


const Cart = ({ infos, isLog }) => {

   const { cart, cartTotal } = useSelector((state) => ({ ...state.cart }));

   const location = useLocation();
   const navigate = useNavigate();
   const dispatch = useDispatch();

   const [clientSecret, setClientSecret] = useState("");
   const options = {
      clientSecret,
      appearance: { theme: "stripe" }
   };

   const [free, setFree] = useState(false);
   const [tax,   setTax] = useState(6.50);
   const [msg,   setMsg] = useState('');

   useEffect(() => {
      dispatch(priceTotal());
   }, [cart, dispatch]);

   useEffect(() => {
      if ((cartTotal) >= 50) {
         setFree(true);
         setTax(0);
      } else {
         setTax(6.50);
         setFree(false);
      };
   }, [cartTotal]);

   useEffect(() => {
      setTimeout(() => {
         if (location.key === 'default') {
            navigate('/cart');
            window.location.href = "/#/cart";
         };
      }, 500)
   }, [infos]);


   const payment = async () => {
      if (infos.address === null || infos.city === null || infos.zip_code === null) {
         return notification(setMsg, 'Vous devez compléter votre adresse dans votre page profil.');
      };

      const pay = await sendPay(!free ? (cartTotal + tax).toFixed(2) : cartTotal.toFixed(2));
      return setClientSecret(pay.data.clientSecret);
   };

   return (
      <main className={styles.cart}>
         <h1>Récapitulatif de votre panier</h1>
         {cart.length === 0 ?
            <section>
               <h2>Votre panier est vide.</h2>
               <FontAwesomeIcon icon={faSadTear} size='4x' />
            </section> : <>

{/* Diplay Items */}

               <section>

                  <section>

                     {cart?.map(item => (

                        <article key={item.id}>
                           <Link to={`/product/detail/${item.id}`}>{item.product_name} &nbsp; {item.percent.toFixed(2)} %</Link>
                           <div>

                              {/* Add / Less Quantity Item */}
                              <div>
                                 <FontAwesomeIcon icon={faMinusSquare}
                                    onClick={() => {
                                       dispatch(lessQuantity(item));
                                       notification(setMsg, "Vous avez retiré un article.")
                                    }} />
                                 <p>{item.item_quantity}</p>
                                 <FontAwesomeIcon icon={faPlusSquare}
                                    onClick={() => {
                                       dispatch(addQuantity(item));
                                       notification(setMsg, "Vous avez ajouté un article.")
                                    }} />
                              </div>

                              <p>{item.price.toFixed(2)} €</p>

                              {/* Delete Item */}
                              <div>
                                 <FontAwesomeIcon icon={faTrashCan} size="2x"
                                    onClick={() => {
                                       dispatch(removeToCart(item));
                                       notification(setMsg, `Vous avez retiré 
                                       ${item.product_name.charAt(0).toUpperCase()}${item.product_name.slice(1)} à votre panier.`)
                                    }} />
                                 <p>{(item.price * item.item_quantity).toFixed(2)} €</p>
                              </div>

                           </div>
                        </article>))}

                     {/* Clear Cart */}
                     <button onClick={() => {
                        dispatch(clearCart());
                        notification(setMsg, "Votre panier a été vidé.")
                     }}>Vider le panier</button>

                  </section>

{/* Price / Infos */}

                  <section>
                     <aside>
                        <h4>Vos achats<span>{cartTotal.toFixed(2)} €</span></h4>
                        <h4>Livraison{!free ? <span>{tax.toFixed(2)} €</span> :
                           <span style={{ color: "green", letterSpacing: "1px" }}>offerte !</span>}</h4>
                        <hr />
                        <h4>Total<span>{(cartTotal + tax).toFixed(2)} €</span></h4>

                        {isLog ? <> <button onClick={() => { payment(); window.scrollTo(0, 1650) }} >Valider le panier</button> </>
                           : <> <Link to={'/customer/login'}>Vous devez être connecté pour finaliser votre achat</Link>
                              <h2 >Total {cartTotal.toFixed(2)} €</h2> </>}
                     </aside>

                     <aside>
                        <div>
                           <FontAwesomeIcon icon={faClockRotateLeft} size="4x" />
                           <p>Livraison en 24h</p>
                        </div>
                        <div>
                           <FontAwesomeIcon icon={faCartFlatbedSuitcase} size="4x" />
                           <p>Frais de port offerts à partir de 50 €</p>
                        </div>
                        <div>
                           <FontAwesomeIcon icon={faShieldHeart} size="4x" />
                           <p>Paiement sécurisé</p>
                        </div>
                     </aside>

                  </section>

               </section></>}

{/* Payment */}

         {clientSecret && (cart.length ?
            <section>
               <Elements options={options} stripe={stripePromise}>
                  <Checkout infos={infos} free={free} cartTotal={cartTotal} tax={tax} cart={cart} setMsg={setMsg} />
               </Elements>
            </section> : <></>)}

         {msg && (<p className='msg'><FontAwesomeIcon icon={faCartArrowDown} size='2x' /> {msg}</p>)}
      </main>
   );
};

export default Cart;