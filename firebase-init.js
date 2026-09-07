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

var PRODUCT_LABEL = {
  'sales-script': '[대본집] 고가상품 세일즈 화법 완전정복',
  'insurance-personal': '보험 판매 화법 (개인)',
  'insurance-corporate': '보험 판매 화법 (법인)'
};
var STANDALONE_PRICE = {
  'sales-script': 79000,
  'insurance-personal': 59000,
  'insurance-corporate': 59000
};
// 조합별 확정 판매가 (정가 합계와 다름 = 묶음 할인 적용)
var BUNDLE_PRICE = {
  'sales-script': 79000,
  'insurance-personal': 59000,
  'insurance-corporate': 59000,
  'insurance-corporate,insurance-personal': 99000,
  'insurance-personal,sales-script': 119000,
  'insurance-corporate,sales-script': 119000,
  'insurance-corporate,insurance-personal,sales-script': 149000
};

function getBundlePrice(itemIds){
  return BUNDLE_PRICE[itemIds.slice().sort().join(',')];
}

// 하위호환용 (예전 코드가 참조할 수 있어 남겨둠)
var PRODUCT_NAME = PRODUCT_LABEL['sales-script'];
var PRODUCT_AMOUNT = STANDALONE_PRICE['sales-script'];

function ensureOrder(user, itemIds){
  var sortedItems = (itemIds && itemIds.length) ? itemIds.slice().sort() : ['sales-script'];
  var amount = getBundlePrice(sortedItems);
  var productName = sortedItems.map(function(id){ return PRODUCT_LABEL[id]; }).join(' + ');
  var ordersRef = db.collection('orders');
  return ordersRef.add({
    uid: user.uid,
    email: user.email,
    items: sortedItems,
    productName: productName,
    amount: amount,
    status: 'completed',
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  }).then(function(ref){ return ref.get(); });
}

function hasPurchased(uid){
  return db.collection('orders').where('uid', '==', uid).where('status', '==', 'completed').limit(1).get()
    .then(function(snap){ return !snap.empty; });
}

// 유저가 실제로 보유한 상품 id 배열 (여러 건의 주문을 합산)
function getPurchasedItems(uid){
  return db.collection('orders').where('uid', '==', uid).where('status', '==', 'completed').get()
    .then(function(snap){
      var owned = {};
      snap.docs.forEach(function(doc){
        var items = doc.data().items;
        if(!items || !items.length){ items = ['sales-script']; } // 이전 방식으로 저장된 구주문 호환
        items.forEach(function(id){ owned[id] = true; });
      });
      return Object.keys(owned);
    });
}
// 하위호환용 별칭
var getOwnedProducts = getPurchasedItems;

function saveLead(data){
  return db.collection('leads').add({
    name: data.name || '',
    email: data.email || '',
    phone: data.phone || '',
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });
}
