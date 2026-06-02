FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY . .
RUN dotnet restore ProjectPulse.sln
RUN dotnet publish src/ProjectPulse.Api/ProjectPulse.Api.csproj -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
ENV ASPNETCORE_URLS=http://+:5000
ENV ASPNETCORE_ENVIRONMENT=Development
COPY --from=build /app/publish .
EXPOSE 5000
ENTRYPOINT ["dotnet", "ProjectPulse.Api.dll"]
