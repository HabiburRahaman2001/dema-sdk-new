import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, Alert } from 'react-native';
import WebView from 'react-native-webview';

const DeemaSDK = ({
  sdkKey,
  merchantOrderId,
  amount,
  currencyCode,
  environment, // New prop to manage environment
  onPaymentStatus,
}) => {
  const [redirectLink, setRedirectLink] = useState("");
  const [loading, setLoading] = useState(false);

  const createMerchantOrder = async (
    sdkKey,
    merchantOrderId,
    amount,
    currencyCode,
    environment
  ) => {
    // Define base URLs for both environments
    const baseUrls = {
      production: "https://staging-api.deema.me/api/merchant/v1/purchase",  // Production base URL
      sandbox: "https://staging-api.deema.me/api/merchant/v1/purchase", // Sandbox base URL
    };

    const baseUrl = baseUrls[environment]; // Get the base URL based on the environment

    try {
      const response = await fetch(baseUrl, {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
          'source': 'sdk',
          Authorization: `Basic ${sdkKey}`,
        },
        body: JSON.stringify({
          merchant_order_id: merchantOrderId,
          amount: amount,
          currency_code: currencyCode,
        }),
      });

      const json = await response.json();

      console.log('API Response:', json);
      console.log('Response Status Code:', response.status);

      return { data: json, statusCode: response.status };
    } catch (error) {
      console.error("API Error:", error);
      return { statusCode: 500 };
    }
  };

  useEffect(() => {
    setLoading(true);
    createMerchantOrder(sdkKey, merchantOrderId, amount, currencyCode, environment)  // Pass environment here
      .then((res) => {
        console.log("API Response:", res);
        if (res.statusCode === 200 && res.data) {
          setRedirectLink(res?.data?.data?.redirect_link);  // Safe navigation to set redirectLink
        } else {
          Alert.alert("Order Creation Failed", "Please try again.");
          onPaymentStatus("failure", "Order creation failed.");
        }
      })
      .finally(() => setLoading(false));
  }, [sdkKey, merchantOrderId, amount, currencyCode, environment]);  // Add environment to dependency array

  const handleNavigationStateChange = (navState) => {
    if (navState.url.includes("success")) {
      console.log("Payment Successful");
      onPaymentStatus("success", "Payment Successful");
    } else if (navState.url.includes("failure")) {
      console.error("Payment Failed");
      onPaymentStatus("failure", "Payment Failed");
    }
  };

  if (loading) {
    return <ActivityIndicator size="large" />;
  }

  return redirectLink ? (
    <View style={{ flex: 1 }}>
      <WebView
        source={{ uri: redirectLink }}
        onNavigationStateChange={handleNavigationStateChange}
      />
    </View>
  ) : (
    <Text>No Order Found</Text>
  );
};

export default DeemaSDK;
