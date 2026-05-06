import { useState } from "react";
import type {
  ActionFunctionArgs,
  HeadersFunction,
  LoaderFunctionArgs,
} from "react-router";
import { Form, useActionData, useLoaderData, useNavigation } from "react-router";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";
import db from "../db.server";

type ActionData = {
  ok: boolean;
  message: string;
  savedToken: string;
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);

  const shopEntry = await db.shop.findUnique({
    where: { shopUrl: session.shop },
    select: { firebaseToken: true },
  });

  return {
    currentToken: shopEntry?.firebaseToken ?? "",
  };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  const firebaseToken = String(formData.get("firebaseToken") ?? "").trim();

  await db.shop.upsert({
    where: { shopUrl: session.shop },
    create: {
      shopUrl: session.shop,
      firebaseToken,
    },
    update: {
      firebaseToken,
    },
  });

  return {
    ok: true,
    message: "Firebase token saved successfully.",
    savedToken: firebaseToken,
  } satisfies ActionData;
};

export default function Index() {
  const { currentToken } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSaving = navigation.state === "submitting";

  const [firebaseToken, setFirebaseToken] = useState(
    actionData?.savedToken ?? currentToken,
  );

  return (
    <s-page heading="Merchant Dashboard">
      <s-section heading="Mobile Push Setup">
        {actionData?.ok && (
          <s-banner tone="success" heading="Saved successfully">
            {actionData.message}
          </s-banner>
        )}

        <s-box
          padding="base"
          borderWidth="base"
          borderRadius="base"
          background="subdued"
        >
          <Form method="post">
            <s-stack direction="block" gap="base">
              <s-text-field
                name="firebaseToken"
                label="Firebase Push Token"
                value={firebaseToken}
                onChange={(e) => setFirebaseToken(e.currentTarget.value ?? "")}
                details="Paste the token from your Android app to link push notifications."
              ></s-text-field>

              <s-stack direction="inline" gap="base" alignItems="center">
                <s-button type="submit" variant="primary" loading={isSaving}>
                  Save Token
                </s-button>
                <s-text>
                  {currentToken
                    ? "A token is currently saved for this store."
                    : "No token saved yet for this store."}
                </s-text>
              </s-stack>
            </s-stack>
          </Form>
        </s-box>

        {currentToken && (
          <s-box
            padding="base"
            borderWidth="base"
            borderRadius="base"
            background="subdued"
          >
            <s-heading>Current saved token</s-heading>
            <s-text>{currentToken}</s-text>
          </s-box>
        )}
      </s-section>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
