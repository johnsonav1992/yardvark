import { Module } from "@nestjs/common";
import { GraphQLModule } from "@nestjs/graphql";
import { ApolloDriver, ApolloDriverConfig } from "@nestjs/apollo";
import { ApolloServerPlugin } from "@apollo/server";
import { ApolloServerPluginLandingPageLocalDefault } from "@apollo/server/plugin/landingPage/default";
import { join } from "path";
import { Request } from "express";
import GraphQLJSON from "graphql-type-json";
import { GraphQLError } from "graphql";

const RequireOperationNamePlugin: ApolloServerPlugin = {
	requestDidStart() {
		return Promise.resolve({
			didResolveOperation(requestContext) {
				const operationName = requestContext.operationName;
				const operationType = requestContext.operation?.operation;

				const isDefaultName =
					!operationName ||
					operationName === "Query" ||
					operationName === "Mutation" ||
					operationName === "Subscription" ||
					(operationType &&
						operationName.toLowerCase() === operationType.toLowerCase());

				if (isDefaultName) {
					throw new GraphQLError(
						'GraphQL operations must have a descriptive name. Generic names like "Query" or "Mutation" are not allowed.',
						{
							extensions: {
								code: "OPERATION_NAME_REQUIRED",
								http: { status: 400 },
							},
						},
					);
				}

				return Promise.resolve();
			},
		});
	},
};

@Module({
	imports: [
		GraphQLModule.forRoot<ApolloDriverConfig>({
			driver: ApolloDriver,
			autoSchemaFile: join(process.cwd(), "src/schema.gql"),
			sortSchema: true,
			introspection: true,
			playground: false,
			plugins: [
				ApolloServerPluginLandingPageLocalDefault({
					embed: true,
					includeCookies: true,
				}),
				RequireOperationNamePlugin,
			],
			context: ({ req }: { req: Request }) => ({ req, user: req.user }),
			resolvers: { JSON: GraphQLJSON },
		}),
	],
})
export class AppGraphQLModule {}
