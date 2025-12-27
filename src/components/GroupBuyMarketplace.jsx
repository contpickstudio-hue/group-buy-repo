import React from 'react';

const GroupBuyMarketplace = ({ products, filters, onJoinGroupBuy, user }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {products && products.length > 0 ? (
        products.map((product) => (
          <div key={product.id} className="card card-product">
            <div className="p-4">
              <h3 className="font-bold text-lg mb-2">{product.title}</h3>
              <p className="text-gray-600 text-sm mb-4">{product.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">${product.price}</span>
                {user && (
                  <button
                    onClick={() => onJoinGroupBuy(product)}
                    className="btn-primary px-4 py-2"
                  >
                    Join
                  </button>
                )}
              </div>
            </div>
          </div>
        ))
      ) : (
        <p className="text-gray-600 col-span-full text-center py-8">No products available</p>
      )}
    </div>
  );
};

export default GroupBuyMarketplace;

