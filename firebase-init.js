var firebaseConfig = {
  apiKey: "AIzaSyBjL-AdZVHBZdsvzqniuPDynk7G3-kH6yU",
  authDomain: "salesscript-87136.firebaseapp.com",
  projectId: "salesscript-87136",
  storageBucket: "salesscript-87136.firebasestorage.app",
  messagingSenderId: "91082261854",
  appId: "1:91082261854:web:73018d6b146d69db6b3bcf"
};
firebase.initializeApp(firebaseConfig);
var auth = firebase.auth();
var db = firebase.firestore();

var PRODUCT_NAME = "[대본집] 고가상품 세일즈 화법 완전정복";
var PRODUCT_AMOUNT = 79000;

function ensureOrder(user){
  var ordersRef = db.collection('orders');
  return ordersRef.where('uid', '==', user.uid).limit(1).get().then(function(snap){
    if(!snap.empty){
      return snap.docs[0];
    }
    return ordersRef.add({
      uid: user.uid,
      email: user.email,
      productName: PRODUCT_NAME,
      amount: PRODUCT_AMOUNT,
      status: 'completed',
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    }).then(function(ref){ return ref.get(); });
  });
}

function hasPurchased(uid){
  return db.collection('orders').where('uid', '==', uid).where('status', '==', 'completed').limit(1).get()
    .then(function(snap){ return !snap.empty; });
}
